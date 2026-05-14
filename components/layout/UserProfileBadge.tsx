'use client';

import { useEffect, useState } from 'react';
import { Shield, User } from 'lucide-react';
import type { UserProfile } from '@/app/api/user/route';

export function UserProfileBadge() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/user');
        const json = await res.json();
        if (json.success) setProfile(json.data);
      } catch {
        // silently ignore
      }
    }
    load();
  }, []);

  if (!profile) {
    return (
      <div className="flex items-center gap-3 px-1 animate-pulse">
        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="flex-1 min-w-0">
          <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
          <div className="h-2 w-16 bg-slate-100 dark:bg-slate-800 rounded mt-1.5" />
        </div>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin';

  return (
    <div className="flex items-center gap-3 px-1">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-cyan-500 flex items-center justify-center text-slate-900 dark:text-white font-bold text-xs shadow-lg shadow-orange-500/20">
          {profile.initials}
        </div>
        {/* Online indicator */}
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
      </div>

      {/* Name + Role */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate leading-tight">
          {profile.display_name}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          {isAdmin ? (
            <Shield className="w-2.5 h-2.5 text-orange-400" />
          ) : (
            <User className="w-2.5 h-2.5 text-slate-500" />
          )}
          <span
            className={`text-xs font-medium ${
              isAdmin ? 'text-orange-400' : 'text-slate-500'
            }`}
          >
            {isAdmin ? 'Admin' : 'Viewer'}
          </span>
        </div>
      </div>
    </div>
  );
}
