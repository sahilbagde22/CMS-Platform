'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, DollarSign, Users, BarChart3 } from 'lucide-react';
import { MetricCard } from '@/components/shared/MetricCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/utils/format-currency';
import { formatPercentage } from '@/lib/utils/format-percentage';
import type { ProjectDetail } from '@/types/app.types';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projects/${id}`);
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
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-7 w-56 bg-slate-800 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-slate-900/50 border border-slate-800/60 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-slate-900/50 border border-slate-800/60 rounded-2xl" />
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm">{error}</div>
    </div>
  );
  if (!data) return null;

  const { project: proj, deployments } = data;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      {/* Header */}
      <div className="p-5 bg-slate-900/50 border border-slate-800/60 rounded-2xl">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">{proj.project_name ?? proj.po_number}</h1>
            <p className="text-slate-400 text-sm mt-0.5">PO: {proj.po_number} · {proj.client ?? 'Unknown client'} · {proj.vertical ?? '—'}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
              <Calendar className="w-3.5 h-3.5" />
              {proj.start_date ?? '—'} → {proj.end_date ?? 'Ongoing'}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500">PO Value</p>
            <p className="text-xl font-bold text-white">{formatCurrency(proj.po_value)}</p>
            {proj.gm_target_pct && <p className="text-xs text-slate-500">Target GM: {formatPercentage(proj.gm_target_pct)}</p>}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Resources" value={data.resource_count} icon={Users} color="violet" />
        <MetricCard label="Active Resources" value={data.active_resource_count} icon={Users} color="emerald" />
        <MetricCard label="Total Revenue" value={formatCurrency(data.total_revenue)} icon={DollarSign} color="cyan" />
        <MetricCard label="GM%" value={formatPercentage(data.gross_margin_pct)} icon={BarChart3} color={data.gross_margin_pct >= 30 ? 'emerald' : 'amber'} />
      </div>

      {/* Deployed Employees */}
      <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/60">
          <h2 className="text-sm font-semibold text-white">Deployed Employees</h2>
        </div>
        {deployments.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-500 text-sm">No deployments for this project.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px]">
              <thead>
                <tr className="border-b border-slate-800/60">
                  {['Employee', 'Department', 'Period', 'Revenue', 'Status'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {deployments.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => router.push(`/employees/${d.emp_id}`)}
                    className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-white">{d.employee_name}</p>
                      <p className="text-xs text-slate-500">{d.designation ?? d.emp_id}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{d.department}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {d.deployment_start ?? '—'} → {d.deployment_end ?? 'Ongoing'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">{formatCurrency(d.revenue)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
