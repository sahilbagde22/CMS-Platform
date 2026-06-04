'use client';

import { User as UserIcon, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  title?: string;
}

export default function Header({ title = 'Dashboard' }: HeaderProps) {
  const router = useRouter();

  
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<User | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const userEmail = user?.email || 'Guest';
  const userName = user?.user_metadata?.full_name || userEmail.split('@')[0];
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <header className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-8 py-6">
      <div className="flex items-center justify-between gap-6">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{title}</h1>

        {/* Right side actions */}
        <div className="flex items-center gap-4">


          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User profile */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 rounded-lg p-1.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                {userInitials || 'JD'}
              </div>
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-gray-100 dark:border-slate-800 overflow-hidden text-ellipsis">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">{user?.email}</p>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => { setShowProfile(false); router.push('/settings'); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 ease-in-out hover:translate-x-1 active:scale-95"
                  >
                    <UserIcon className="w-4 h-4" />
                    My Profile
                  </button>

                </div>
                <div className="p-2 border-t border-gray-100 dark:border-slate-800">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all duration-200 ease-in-out hover:translate-x-1 active:scale-95"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
