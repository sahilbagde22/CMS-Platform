'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  Upload,
  Activity,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/departments', label: 'Departments', icon: Building2 },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/upload', label: 'Upload Data', icon: Upload },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-slate-900/60 border-r border-slate-800/60 flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-slate-800/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">OpsHive</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/overview'
              ? pathname === '/overview' || pathname === '/'
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }
              `}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-400' : ''}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800/60 shrink-0">
        <p className="text-xs text-slate-600 text-center">OpsHive v1.0 · Phase 1</p>
      </div>
    </aside>
  );
}
