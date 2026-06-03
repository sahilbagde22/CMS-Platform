'use client';

import { Search, Bell, User } from 'lucide-react';

interface HeaderProps {
  title?: string;
}

export default function Header({ title = 'Dashboard' }: HeaderProps) {
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
              placeholder="Search..."
              className="rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none"
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
