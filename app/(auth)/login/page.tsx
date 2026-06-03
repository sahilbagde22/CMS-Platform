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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm relative">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 mb-4 shadow-sm">
            <span className="text-xl font-bold text-white">D</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Sign in to your <span className="text-indigo-600 font-medium">Datahive</span> account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors mt-6 shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'} 
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors">
            Sign up
          </Link>
        </div>

        {/* Footer brand */}
        <p className="text-center text-xs text-gray-400 mt-6">Datahive · Operations Intelligence</p>
      </div>
    </div>
  );
}
