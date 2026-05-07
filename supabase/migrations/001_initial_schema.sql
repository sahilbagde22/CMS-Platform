-- ============================================================
-- DataHive — Initial Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type department_type as enum (
  'HR', 'Finance', 'Marketing', 'Operations', 'Tech', 'Leadership', 'Other'
);

-- ============================================================
-- TABLES
-- ============================================================

-- Users profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  department department_type,
  role text default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Uploaded Excel files (raw)
create table public.uploads (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  department department_type,
  file_name text not null,
  storage_path text not null,
  file_size_bytes bigint,
  sheet_count int default 0,
  status text default 'processing' check (status in ('processing', 'ready', 'error')),
  error_message text,
  created_at timestamptz default now()
);

-- Individual sheets from an upload
create table public.datasets (
  id uuid default uuid_generate_v4() primary key,
  upload_id uuid references public.uploads(id) on delete cascade,
  user_id uuid references public.profiles(id),
  department department_type,
  sheet_name text not null,
  display_name text,
  row_count int default 0,
  column_count int default 0,
  schema_json jsonb,           -- { columns: [{name, type, originalName}] }
  data_json jsonb,             -- Actual row data (capped at 10K rows)
  has_ai_cleaned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- AI cleaning report per dataset
create table public.ai_flags (
  id uuid default uuid_generate_v4() primary key,
  dataset_id uuid references public.datasets(id) on delete cascade,
  flag_type text check (flag_type in ('typo', 'date_serial', 'missing_value', 'logical_inconsistency', 'duplicate', 'outlier')),
  severity text default 'warning' check (severity in ('info', 'warning', 'error')),
  original_value text,
  suggested_value text,
  column_name text,
  row_index int,
  message text not null,
  resolved boolean default false,
  created_at timestamptz default now()
);

-- Dataset relationships (cross-sheet joins)
create table public.dataset_relations (
  id uuid default uuid_generate_v4() primary key,
  source_dataset_id uuid references public.datasets(id) on delete cascade,
  target_dataset_id uuid references public.datasets(id) on delete cascade,
  source_column text not null,
  target_column text not null,
  relation_type text default 'many_to_one',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Saved charts
create table public.charts (
  id uuid default uuid_generate_v4() primary key,
  dataset_id uuid references public.datasets(id) on delete cascade,
  created_by uuid references public.profiles(id),
  title text not null,
  chart_type text not null check (chart_type in ('bar','line','pie','donut','scatter','area','heatmap','kpi','table')),
  config_json jsonb not null,   -- ECharts option object
  filter_json jsonb,            -- Applied filters
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Dashboard layouts
create table public.dashboards (
  id uuid default uuid_generate_v4() primary key,
  created_by uuid references public.profiles(id),
  title text not null,
  description text,
  department department_type,
  layout_json jsonb not null,   -- dnd-kit layout positions
  is_public boolean default false,
  shared_token text unique,     -- For shareable link
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Dashboard widgets (charts placed on a dashboard)
create table public.dashboard_widgets (
  id uuid default uuid_generate_v4() primary key,
  dashboard_id uuid references public.dashboards(id) on delete cascade,
  chart_id uuid references public.charts(id) on delete cascade,
  position_json jsonb not null,  -- { x, y, w, h }
  created_at timestamptz default now()
);

-- AI query history
create table public.ai_queries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  dataset_id uuid references public.datasets(id),
  natural_language text not null,
  generated_sql text,
  result_json jsonb,
  chart_config_json jsonb,
  error text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.uploads enable row level security;
alter table public.datasets enable row level security;
alter table public.ai_flags enable row level security;
alter table public.dataset_relations enable row level security;
alter table public.charts enable row level security;
alter table public.dashboards enable row level security;
alter table public.dashboard_widgets enable row level security;
alter table public.ai_queries enable row level security;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Profiles
create policy "Users see own profile"
  on public.profiles for all
  using (auth.uid() = id);

-- Uploads
create policy "Users see own uploads"
  on public.uploads for all
  using (auth.uid() = user_id);

-- Datasets
create policy "Users see own datasets"
  on public.datasets for select
  using (auth.uid() = user_id);

create policy "Users insert own datasets"
  on public.datasets for insert
  with check (auth.uid() = user_id);

create policy "Users update own datasets"
  on public.datasets for update
  using (auth.uid() = user_id);

create policy "Users delete own datasets"
  on public.datasets for delete
  using (auth.uid() = user_id);

-- AI Flags (accessible if you own the dataset)
create policy "Users see ai flags for their datasets"
  on public.ai_flags for all
  using (
    exists (
      select 1 from public.datasets d
      where d.id = ai_flags.dataset_id
        and d.user_id = auth.uid()
    )
  );

-- Dataset Relations
create policy "Users manage their dataset relations"
  on public.dataset_relations for all
  using (auth.uid() = created_by);

-- Charts
create policy "Users see own or public charts"
  on public.charts for select
  using (auth.uid() = created_by or is_public = true);

create policy "Users insert own charts"
  on public.charts for insert
  with check (auth.uid() = created_by);

create policy "Users update own charts"
  on public.charts for update
  using (auth.uid() = created_by);

create policy "Users delete own charts"
  on public.charts for delete
  using (auth.uid() = created_by);

-- Dashboards
create policy "Users see own or public dashboards"
  on public.dashboards for select
  using (auth.uid() = created_by or is_public = true);

create policy "Users insert own dashboards"
  on public.dashboards for insert
  with check (auth.uid() = created_by);

create policy "Users update own dashboards"
  on public.dashboards for update
  using (auth.uid() = created_by);

create policy "Users delete own dashboards"
  on public.dashboards for delete
  using (auth.uid() = created_by);

-- Dashboard Widgets
create policy "Users manage widgets for their dashboards"
  on public.dashboard_widgets for all
  using (
    exists (
      select 1 from public.dashboards d
      where d.id = dashboard_widgets.dashboard_id
        and d.created_by = auth.uid()
    )
  );

-- AI Queries
create policy "Users see own ai queries"
  on public.ai_queries for all
  using (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
