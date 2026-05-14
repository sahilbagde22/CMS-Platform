'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, DollarSign, BarChart3, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MetricCard } from '@/components/shared/MetricCard';
import { formatCurrency } from '@/lib/utils/format-currency';
import { formatPercentage } from '@/lib/utils/format-percentage';
import type { EmployeeDetail } from '@/types/app.types';

function SkeletonBlock({ h = 'h-4', w = 'w-32' }: { h?: string; w?: string }) {
  return <div className={`${h} ${w} bg-slate-100 dark:bg-slate-800 rounded animate-pulse`} />;
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/employees/${id}`);
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
  }, [id]);

  if (loading) return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <SkeletonBlock h="h-7" w="w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl animate-pulse" />)}
      </div>
      <div className="h-48 bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl animate-pulse" />
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm">{error}</div>
    </div>
  );

  if (!data) return null;

  const { employee: emp, metrics, deployments } = data;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Employees
      </button>

      {/* Profile Header */}
      <div className="flex items-start gap-4 p-5 bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-cyan-500 flex items-center justify-center text-slate-900 dark:text-white font-bold text-xl shrink-0">
          {emp.name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{emp.name}</h1>
            <StatusBadge status={emp.status} />
            {metrics && <StatusBadge status={metrics.deployment_status} />}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{emp.designation ?? 'No designation'} · {emp.department}</p>
          <p className="text-slate-500 text-xs mt-0.5">ID: {emp.emp_id}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-500">Monthly CTC</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(emp.monthly_ctc)}</p>
          <p className="text-xs text-slate-600">Annual: {formatCurrency(emp.annual_ctc)}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Revenue" value={formatCurrency(metrics?.total_revenue)} icon={DollarSign} color="cyan" />
        <MetricCard label="Total Cost" value={formatCurrency(metrics?.total_cost)} icon={DollarSign} color="rose" />
        <MetricCard label="Gross Margin" value={formatCurrency(metrics?.gross_margin)} icon={BarChart3} color={( metrics?.gross_margin ?? 0) >= 0 ? 'emerald' : 'rose'} />
        <MetricCard label="GM%" value={formatPercentage(metrics?.gross_margin_pct)} icon={BarChart3} color={(metrics?.gross_margin_pct ?? 0) >= 30 ? 'emerald' : 'amber'} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Active POs" value={metrics?.active_po_count ?? 0} icon={BarChart3} color="violet" />
        <MetricCard label="Days Deployed" value={metrics?.total_days_deployed ?? 0} icon={Clock} color="cyan" />
      </div>

      {/* Deployment History */}
      <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Deployment History</h2>
        </div>
        {deployments.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-500 text-sm">No deployments found for this employee.</div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {deployments.map((d) => (
              <div key={d.id} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{d.project_name ?? d.po_number}</p>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">PO: {d.po_number} · {d.client ?? 'Unknown client'}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    {d.deployment_start ?? '—'} → {d.deployment_end ?? 'Ongoing'}
                    {d.duration_days !== null && <span className="ml-2 text-slate-600">({d.duration_days} days)</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{formatCurrency(d.revenue)}</p>
                  <p className="text-xs text-slate-500">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
