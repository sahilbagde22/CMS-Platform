-- OpsHive Phase 1 — Full Database Schema
-- Run this in Supabase SQL editor: https://supabase.com/dashboard/project/<your-project>/sql/new
-- Or use: supabase db push (after linking your project)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Drop existing tables (if migrating from DataHive) ───────────────────────
drop table if exists public.ai_queries cascade;
drop table if exists public.dashboard_widgets cascade;
drop table if exists public.dashboards cascade;
drop table if exists public.charts cascade;
drop table if exists public.ai_flags cascade;
drop table if exists public.datasets cascade;
drop table if exists public.uploads cascade;
drop table if exists public.profiles cascade;

-- ─── Drop old enums ───────────────────────────────────────────────────────────
drop type if exists public.department_type cascade;

-- ─── Create enums ─────────────────────────────────────────────────────────────
create type employee_status as enum ('Active', 'Inactive');
create type deployment_status as enum ('Active', 'Completed', 'Bench');
create type upload_status as enum ('processing', 'ready', 'error');

-- ─── uploads ─────────────────────────────────────────────────────────────────
create table public.uploads (
  id           uuid default uuid_generate_v4() primary key,
  file_name    text not null,
  storage_path text not null,
  file_size    bigint,
  status       upload_status default 'processing',
  error_msg    text,
  uploaded_at  timestamptz default now()
);

-- ─── employees ───────────────────────────────────────────────────────────────
create table public.employees (
  id               uuid default uuid_generate_v4() primary key,
  upload_id        uuid references public.uploads(id) on delete cascade,
  emp_id           text not null,
  name             text not null,
  department       text not null,
  designation      text,
  annual_ctc       numeric(15,2),
  monthly_ctc      numeric(15,2),
  status           employee_status default 'Active',
  created_at       timestamptz default now(),
  unique(upload_id, emp_id)
);

create index idx_employees_upload_id on public.employees(upload_id);
create index idx_employees_department on public.employees(department);

-- ─── projects ────────────────────────────────────────────────────────────────
create table public.projects (
  id              uuid default uuid_generate_v4() primary key,
  upload_id       uuid references public.uploads(id) on delete cascade,
  po_number       text not null,
  project_name    text,
  client          text,
  vertical        text,
  po_value        numeric(15,2),
  start_date      date,
  end_date        date,
  gm_target_pct   numeric(6,2),
  created_at      timestamptz default now(),
  unique(upload_id, po_number)
);

create index idx_projects_upload_id on public.projects(upload_id);

-- ─── deployments ─────────────────────────────────────────────────────────────
create table public.deployments (
  id                         uuid default uuid_generate_v4() primary key,
  upload_id                  uuid references public.uploads(id) on delete cascade,
  emp_id                     text not null,
  po_number                  text not null,
  deployment_start           date,
  deployment_end             date,
  revenue                    numeric(15,2),
  proprietary_charges        numeric(15,2),
  blended_revenue_multiplier numeric(8,4),
  status                     deployment_status,
  duration_days              int,
  created_at                 timestamptz default now()
);

create index idx_deployments_upload_id on public.deployments(upload_id);
create index idx_deployments_emp_id on public.deployments(emp_id);
create index idx_deployments_po_number on public.deployments(po_number);

-- ─── employee_metrics ────────────────────────────────────────────────────────
create table public.employee_metrics (
  id                  uuid default uuid_generate_v4() primary key,
  upload_id           uuid references public.uploads(id) on delete cascade,
  emp_id              text not null,
  total_revenue       numeric(15,2),
  total_cost          numeric(15,2),
  gross_margin        numeric(15,2),
  gross_margin_pct    numeric(6,2),
  deployment_status   deployment_status,
  active_po_count     int default 0,
  total_days_deployed int default 0,
  unique(upload_id, emp_id)
);

create index idx_emp_metrics_upload_id on public.employee_metrics(upload_id);

-- ─── department_metrics ───────────────────────────────────────────────────────
create table public.department_metrics (
  id                 uuid default uuid_generate_v4() primary key,
  upload_id          uuid references public.uploads(id) on delete cascade,
  department         text not null,
  headcount          int default 0,
  deployed_count     int default 0,
  bench_count        int default 0,
  deployment_pct     numeric(6,2),
  total_revenue      numeric(15,2),
  total_cost         numeric(15,2),
  total_profit       numeric(15,2),
  gross_margin_pct   numeric(6,2),
  unique(upload_id, department)
);

create index idx_dept_metrics_upload_id on public.department_metrics(upload_id);

-- ─── company_metrics ─────────────────────────────────────────────────────────
create table public.company_metrics (
  id                 uuid default uuid_generate_v4() primary key,
  upload_id          uuid references public.uploads(id) on delete cascade unique,
  total_employees    int default 0,
  deployed_count     int default 0,
  bench_count        int default 0,
  overall_deploy_pct numeric(6,2),
  total_revenue      numeric(15,2),
  total_cost         numeric(15,2),
  total_profit       numeric(15,2),
  overall_gm_pct     numeric(6,2),
  calculated_at      timestamptz default now()
);
