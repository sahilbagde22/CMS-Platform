'use client';

import { Search, Bell, User } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
}

export default function Header({ title = 'Dashboard' }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="border-b border-gray-200 bg-white px-8 py-6">
      <div className="flex items-center justify-between gap-6">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  const q = searchQuery.trim().toLowerCase();
                  
                  // Quick Navigation
                  if (q === 'projects' || q === 'project' || q === 'pos') {
                    router.push('/projects');
                    setSearchQuery('');
                    return;
                  }
                  if (q === 'departments' || q === 'department' || q === 'dept') {
                    router.push('/departments');
                    setSearchQuery('');
                    return;
                  }
                  if (q === 'employees' || q === 'employee' || q === 'staff') {
                    router.push('/employees');
                    setSearchQuery('');
                    return;
                  }
                  if (q === 'overview' || q === 'dashboard' || q === 'home') {
                    router.push('/overview');
                    setSearchQuery('');
                    return;
                  }
                  if (q === 'upload' || q === 'import') {
                    router.push('/upload');
                    setSearchQuery('');
                    return;
                  }

                  // Contextual Search fallback
                  const encodedQ = encodeURIComponent(searchQuery.trim());
                  const path = window.location.pathname;
                  if (path.startsWith('/projects')) {
                    router.push(`/projects?q=${encodedQ}`);
                  } else if (path.startsWith('/departments')) {
                    router.push(`/departments?q=${encodedQ}`);
                  } else {
                    router.push(`/employees?q=${encodedQ}`);
                  }
                }
              }}
              placeholder="Search or jump to..."
              className="rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none w-64"
            />
          </div>

          {/* Notifications */}
          <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <Bell size={20} />
            <span className="absolute right-1 top-1 flex h-2 w-2 items-center justify-center rounded-full bg-red-500"></span>
          </button>

          {/* User profile */}
          <button className="flex items-center gap-2 rounded-lg p-2 text-gray-700 hover:bg-gray-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
              JD
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
