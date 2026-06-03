'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, DollarSign, Users, BarChart3 } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import KPICard from '@/components/shared/KPICard';
import Card from '@/components/shared/Card';
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
      <div className="h-7 w-56 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Card key={i} className="h-24 animate-pulse bg-gray-100" />)}
      </div>
      <Card className="h-64 animate-pulse bg-gray-100" />
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
      <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      {/* Header */}
      <Card className="p-5">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{proj.project_name ?? proj.po_number}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">PO: {proj.po_number} · {proj.client ?? 'Unknown client'} · {proj.vertical ?? '—'}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
              <Calendar className="w-3.5 h-3.5" />
              {proj.start_date ?? '—'} → {proj.end_date ?? 'Ongoing'}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500">PO Value</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(proj.po_value)}</p>
            {proj.gm_target_pct && <p className="text-xs text-slate-500">Target GM: {formatPercentage(proj.gm_target_pct)}</p>}
          </div>
        </div>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Resources" value={data.resource_count} />
        <KPICard label="Active Resources" value={data.active_resource_count} />
        <KPICard label="Total Revenue" value={formatCurrency(data.total_revenue)} />
        <KPICard label="GM%" value={formatPercentage(data.gross_margin_pct)} />
      </div>

      {/* Deployed Employees */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Deployed Employees</h2>
        </div>
        {deployments.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-500 text-sm">No deployments for this project.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {['Employee', 'Department', 'Period', 'Revenue', 'Status'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deployments.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => router.push(`/employees/${d.emp_id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{d.employee_name}</p>
                      <p className="text-xs text-slate-500">{d.designation ?? d.emp_id}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{d.department}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {d.deployment_start ?? '—'} → {d.deployment_end ?? 'Ongoing'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300">{formatCurrency(d.revenue)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
