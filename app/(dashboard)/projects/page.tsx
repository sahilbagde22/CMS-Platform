'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderKanban, Upload } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/utils/format-currency';
import { formatPercentage } from '@/lib/utils/format-percentage';
import type { ProjectListItem } from '@/types/app.types';

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-3.5 border-b border-slate-800/40">
          <div className="h-4 bg-slate-800 rounded w-32" />
          <div className="h-4 bg-slate-800 rounded w-24" />
          <div className="h-4 bg-slate-800 rounded w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/projects');
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setProjects(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (error) return (
    <div className="p-6">
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm">{error}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Projects / POs</h1>
        <span className="text-slate-500 text-sm">{projects.length} projects</span>
      </div>

      <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-800/60">
                {['Project', 'Client', 'Vertical', 'PO Value', 'Resources', 'Revenue', 'GM%', 'Status'].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {!loading && projects.map((proj) => {
                const isActive = proj.end_date ? new Date(proj.end_date) > new Date() : true;
                return (
                  <tr
                    key={proj.id}
                    onClick={() => router.push(`/projects/${proj.po_number}`)}
                    className="hover:bg-slate-800/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">{proj.project_name ?? proj.po_number}</p>
                      <p className="text-xs text-slate-500">{proj.po_number}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{proj.client ?? '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{proj.vertical ?? '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-300 font-medium">{formatCurrency(proj.po_value)}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-white">{proj.active_resource_count}</span>
                      <span className="text-xs text-slate-500"> / {proj.resource_count} total</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">{formatCurrency(proj.total_revenue)}</td>
                    <td className="px-5 py-3.5 text-sm font-medium">
                      <span className={proj.gross_margin_pct >= 30 ? 'text-emerald-400' : proj.gross_margin_pct >= 0 ? 'text-amber-400' : 'text-rose-400'}>
                        {formatPercentage(proj.gross_margin_pct)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${isActive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-slate-700/60 text-slate-400 border-slate-600/40'}`}>
                        {isActive ? 'Active' : 'Closed'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {loading && <TableSkeleton />}
        </div>
        {!loading && projects.length === 0 && (
          <EmptyState icon={FolderKanban} title="No projects found" description="Upload your Excel file to see project metrics." ctaLabel="Upload Data" ctaHref="/upload" />
        )}
      </div>
    </div>
  );
}
