'use client';

import { useState } from 'react';
import { signup } from '@/app/actions/auth';
import Link from 'next/link';
import { Loader2, ArrowRight, CheckCircle, Activity } from 'lucide-react';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await signup(formData);
    
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.success);
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">Create Account</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Join <span className="text-orange-400 font-medium">OpsHive</span> to manage your operations</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-2">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Check your email</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 pb-4">{success}</p>
            <Link 
              href="/login"
              className="inline-block w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white font-medium py-2.5 rounded-xl transition-all text-center"
            >
              Back to Login
            </Link>
          </div>
        ) : (
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
                minLength={6}
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'} 
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        )}

        {/* Footer brand */}
        <p className="text-center text-xs text-slate-600 mt-6">OpsHive v2.0 · Operations Intelligence</p>
      </div>
    </div>
  );
}
