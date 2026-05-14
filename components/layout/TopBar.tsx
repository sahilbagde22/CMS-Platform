'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, Search, Command, Sun, Moon, Keyboard } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useCommandPalette } from '@/components/layout/CommandPalette';
import type { UserProfile } from '@/app/api/user/route';

const ROUTE_LABELS: Record<string, string> = {
  '/overview': 'Overview',
  '/employees': 'Employees',
  '/departments': 'Departments',
  '/projects': 'Projects',
  '/upload': 'Upload Data',
  '/settings': 'Settings',
};

function getBreadcrumb(pathname: string): string {
  for (const [prefix, label] of Object.entries(ROUTE_LABELS)) {
    if (pathname.startsWith(prefix)) return label;
  }
  return 'OpsHive';
}

function AlertBadge() {
  const [counts, setCounts] = useState<{ critical: number; total: number } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/alerts');
        const json = await res.json();
        if (json.success) {
          setCounts({ critical: json.data.critical_count, total: json.data.total });
        }
      } catch {
        // Non-critical — silently ignore
      }
    }
    load();
  }, []);

  if (!counts || counts.total === 0) return null;

  const hasCritical = counts.critical > 0;

  return (
    <Link
      href="/overview"
      title={`${counts.total} alert${counts.total !== 1 ? 's' : ''}`}
      className={`
        relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all
        ${hasCritical
          ? 'bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25'
          : 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
        }
      `}
    >
      <Bell className="w-3.5 h-3.5" />
      <span>{counts.total}</span>
      {hasCritical && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
      )}
      {hasCritical && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />
      )}
    </Link>
  );
}

function UserGreeting() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/user');
        const json = await res.json();
        if (json.success) setUser(json.data);
      } catch {
        // silently ignore
      }
    }
    load();
  }, []);

  if (!user) return null;

  return (
    <div className="hidden md:flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-cyan-500 flex items-center justify-center text-slate-900 dark:text-white font-bold text-xs shadow-lg shadow-orange-500/20">
        {user.initials}
      </div>
      <div className="text-right">
        <p className="text-xs font-medium text-slate-900 dark:text-white leading-tight">{user.display_name}</p>
        <p className="text-[10px] text-slate-500 leading-tight capitalize">{user.role}</p>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 transition-colors opacity-50"
        title="Loading theme..."
      >
        <div className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 transition-colors"
      title="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const breadcrumb = getBreadcrumb(pathname);
  const { open } = useCommandPalette();

  return (
    <header className="h-14 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-slate-900 dark:text-white text-sm font-semibold">{breadcrumb}</span>
      </div>

      {/* Centre: search bar shortcut */}
      <button
        onClick={open}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:bg-slate-800 border border-slate-300/40 dark:border-slate-700/40 hover:border-slate-600/60 rounded-xl text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-all group"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search employees, projects…</span>
        <span className="flex items-center gap-0.5 text-slate-600 group-hover:text-slate-500 transition-colors ml-1">
          <Command className="w-3 h-3" />
          <span>K</span>
        </span>
      </button>

      <div className="flex items-center gap-3">
        {/* Live alert badge */}
        <AlertBadge />

        {/* User greeting */}
        <UserGreeting />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Shortcuts Help */}
        <button
          onClick={open}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 transition-colors"
          title="Keyboard shortcuts (Cmd+K)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Phase tag */}
        <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs text-orange-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          Phase 2
        </span>
      </div>
    </header>
  );
}
