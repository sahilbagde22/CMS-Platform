'use client';

import Link from 'next/link';
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
      className={`flex flex-col gap-8 border-r border-gray-200 bg-white px-6 py-8 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <span className="text-sm font-bold text-white">D</span>
            </div>
            <span className="text-lg font-bold text-gray-900">Datahive</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
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
              className={`group flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${
                pathname?.startsWith(item.href)
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-50'
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
      <div className="flex flex-col gap-2 border-t border-gray-200 pt-4">
        <Link 
          href="/settings"
          className={`group flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${
            pathname?.startsWith('/settings')
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Settings size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
        </Link>
        <button onClick={handleLogout} className="group flex items-center gap-3 rounded-lg px-4 py-2.5 text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600">
          <LogOut size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
