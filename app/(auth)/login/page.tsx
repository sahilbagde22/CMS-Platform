'use client';

import { useState } from 'react';
import { login } from '@/app/actions/auth';
import Link from 'next/link';
import { Loader2, ArrowRight, Activity } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await login(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0C10] p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-8 shadow-xl backdrop-blur-sm relative">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4">
            <Activity className="w-6 h-6 text-slate-900 dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Sign in to your <span className="text-orange-400 font-medium">OpsHive</span> account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300/50 dark:border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300/50 dark:border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:opacity-50 disabled:hover:from-orange-600 text-slate-900 dark:text-white font-medium py-2.5 rounded-xl transition-all mt-6 shadow-lg shadow-orange-500/25"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'} 
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
            Sign up
          </Link>
        </div>

        {/* Footer brand */}
        <p className="text-center text-xs text-slate-600 mt-6">OpsHive v2.0 · Operations Intelligence</p>
      </div>
    </div>
  );
}
