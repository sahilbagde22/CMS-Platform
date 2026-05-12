'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, Search, Command } from 'lucide-react';
import Link from 'next/link';
import { useCommandPalette } from '@/components/layout/CommandPalette';

const ROUTE_LABELS: Record<string, string> = {
  '/overview': 'Overview',
  '/employees': 'Employees',
  '/departments': 'Departments',
  '/projects': 'Projects',
  '/upload': 'Upload Data',
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

export function TopBar() {
  const pathname = usePathname();
  const breadcrumb = getBreadcrumb(pathname);
  const { open } = useCommandPalette();

  return (
    <header className="h-14 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-semibold">{breadcrumb}</span>
      </div>

      {/* Centre: search bar shortcut */}
      <button
        onClick={open}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 hover:border-slate-600/60 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-all group"
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
        {/* Phase tag */}
        <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs text-violet-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Phase 2
        </span>
      </div>
    </header>
  );
}
