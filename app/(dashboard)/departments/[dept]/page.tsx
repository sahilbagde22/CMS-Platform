'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MetricCard } from '@/components/shared/MetricCard';
import { formatCurrency } from '@/lib/utils/format-currency';
import { formatPercentage } from '@/lib/utils/format-percentage';
import type { DepartmentDetail } from '@/types/app.types';

export default function DepartmentDetailPage() {
  const { dept } = useParams<{ dept: string }>();
  const router = useRouter();
  const [data, setData] = useState<DepartmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/departments/${dept}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dept]);

  if (loading) return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-7 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl" />
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm">{error}</div>
    </div>
  );
  if (!data) return null;

  const { metrics, employees } = data;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Departments
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{decodeURIComponent(dept)}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{metrics.headcount} employees</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Deployed" value={metrics.deployed_count} color="emerald" subtitle={formatPercentage(metrics.deployment_pct) + ' rate'} />
        <MetricCard label="On Bench" value={metrics.bench_count} color="amber" />
        <MetricCard label="Revenue" value={formatCurrency(metrics.total_revenue)} color="cyan" />
        <MetricCard label="GM%" value={formatPercentage(metrics.gross_margin_pct)} color={metrics.gross_margin_pct >= 30 ? 'emerald' : 'amber'} />
      </div>

      <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Employees in {decodeURIComponent(dept)}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/60">
                {['Name', 'Designation', 'Status', 'Deploy Status', 'Revenue', 'GM%'].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => router.push(`/employees/${emp.emp_id}`)}
                  className="hover:bg-slate-100/30 dark:bg-slate-800/30 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{emp.name}</p>
                    <p className="text-xs text-slate-500">{emp.emp_id}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{emp.designation ?? '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={emp.status} /></td>
                  <td className="px-5 py-3.5">{emp.metrics ? <StatusBadge status={emp.metrics.deployment_status} /> : '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300">{formatCurrency(emp.metrics?.total_revenue)}</td>
                  <td className="px-5 py-3.5 text-sm font-medium">
                    <span className={(emp.metrics?.gross_margin_pct ?? 0) >= 30 ? 'text-emerald-400' : 'text-amber-400'}>
                      {formatPercentage(emp.metrics?.gross_margin_pct)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
