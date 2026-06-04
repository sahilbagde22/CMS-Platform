'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  BarChart3,
  Users,
  Briefcase,
  Building2,
  Upload,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
} from 'lucide-react';
import Button from '@/components/shared/Button';

const navItems = [
  { href: '/overview', icon: BarChart3, label: 'Overview' },
  { href: '/employees', icon: Users, label: 'Employees' },
  { href: '/departments', icon: Building2, label: 'Departments' },
  { href: '/projects', icon: Briefcase, label: 'Projects' },
  { href: '/upload', icon: Upload, label: 'Upload Data' },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside
      className={`flex flex-col gap-8 border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 backdrop-blur-xl dark:bg-slate-950/80 px-6 py-8 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="relative flex h-8 w-14 items-center justify-center overflow-hidden rounded-md bg-transparent">
              <Image src="/logo.png" alt="PulseHQ Logo" fill className="object-contain" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">PulseHQ</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-200 ease-in-out hover:translate-x-1 active:scale-[0.98] ${
                pathname?.startsWith(item.href)
                  ? 'bg-indigo-100/50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={20} />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-slate-200 dark:border-slate-800/50 pt-4">
        <Link 
          href="/settings"
          className={`group flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-200 ease-in-out hover:translate-x-1 active:scale-[0.98] ${
            pathname?.startsWith('/settings')
              ? 'bg-indigo-100/50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Settings size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
        </Link>
        <button onClick={handleLogout} className="group flex items-center gap-3 rounded-lg px-4 py-2.5 text-slate-600 dark:text-slate-400 transition-all duration-200 ease-in-out hover:translate-x-1 active:scale-[0.98] hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400">
          <LogOut size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
