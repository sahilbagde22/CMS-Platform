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
  LogOut,
  X,
  Settings,
} from 'lucide-react';
import { logout } from '@/app/actions/auth';
import { SearchTriggerButton } from '@/components/layout/CommandPalette';
import { UserProfileBadge } from '@/components/layout/UserProfileBadge';

const NAV_ITEMS = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/departments', label: 'Departments', icon: Building2 },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/upload', label: 'Upload Data', icon: Upload },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

interface SidebarProps {
  /** Mobile-only: whether the sidebar overlay is open */
  mobileOpen?: boolean;
  /** Mobile-only: callback to close the overlay */
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Activity className="w-4 h-4 text-slate-900 dark:text-white" />
          </div>
          <span className="text-slate-900 dark:text-white font-bold text-sm tracking-tight">OpsHive</span>
        </div>
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search trigger */}
      <div className="px-4 pt-5 pb-2">
        <SearchTriggerButton />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }, index) => {
          const isActive =
            href === '/overview'
              ? pathname === '/overview' || pathname === '/'
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={`
                group flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 animate-slide-in-right
                ${isActive
                  ? 'bg-orange-500/15 text-orange-300 border border-orange-500/20 shadow-sm shadow-orange-500/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-100/60 dark:bg-slate-800/60 border border-transparent hover:translate-x-1'
                }
              `}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-orange-400' : ''}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — User Profile + Sign Out */}
      <div className="px-5 py-5 border-t border-slate-200/60 dark:border-slate-800/60 shrink-0 space-y-4">
        {/* User Profile Badge */}
        <UserProfileBadge />

        <button
          onClick={() => logout()}
          className="flex w-full items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
        <p className="text-xs text-slate-600 text-center">OpsHive v2.0</p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <aside className="hidden md:flex w-60 shrink-0 bg-white/60 dark:bg-slate-900/60 border-r border-slate-200/60 dark:border-slate-800/60 flex-col h-full">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Slide-in panel */}
          <aside className="relative w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-left">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
