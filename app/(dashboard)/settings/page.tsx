'use client';

import { useState, useEffect } from 'react';
import { updateProfile, updatePassword } from '@/app/actions/auth';
import { User, Lock, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import type { UserProfile } from '@/app/api/user/route';

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile state
  const [profilePending, setProfilePending] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'error'|'success', text: string } | null>(null);

  // Password state
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'error'|'success', text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/user');
        const json = await res.json();
        if (json.success) setUser(json.data);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleProfile(formData: FormData) {
    setProfilePending(true);
    setProfileMsg(null);
    const result = await updateProfile(formData);
    setProfilePending(false);
    
    if (result.error) setProfileMsg({ type: 'error', text: result.error });
    else setProfileMsg({ type: 'success', text: result.success! });
  }

  async function handlePassword(formData: FormData) {
    setPasswordPending(true);
    setPasswordMsg(null);
    const result = await updatePassword(formData);
    setPasswordPending(false);
    
    if (result.error) setPasswordMsg({ type: 'error', text: result.error });
    else setPasswordMsg({ type: 'success', text: result.success! });
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your account preferences and security.</p>
      </div>

      <div className="grid gap-8">
        {/* Profile Card */}
        <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-100/20 dark:bg-slate-800/20 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profile Information</h2>
          </div>
          <div className="p-6">
            <form action={handleProfile} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  disabled 
                  className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                <input 
                  name="displayName"
                  type="text" 
                  defaultValue={user?.display_name || ''} 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              {profileMsg && (
                <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${
                  profileMsg.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {profileMsg.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                  <p>{profileMsg.text}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={profilePending}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-slate-900 dark:text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {profilePending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Profile
              </button>
            </form>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-100/20 dark:bg-slate-800/20 flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security</h2>
          </div>
          <div className="p-6">
            <form action={handlePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input 
                  name="password"
                  type="password" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                <input 
                  name="confirmPassword"
                  type="password" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="Repeat new password"
                  required
                />
              </div>

              {passwordMsg && (
                <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${
                  passwordMsg.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {passwordMsg.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                  <p>{passwordMsg.text}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={passwordPending}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-900 dark:text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {passwordPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
