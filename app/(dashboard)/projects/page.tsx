'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FolderKanban, Upload } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { ExportDropdown } from '@/components/shared/ExportDropdown';
import { formatCurrency } from '@/lib/utils/format-currency';
import { formatPercentage } from '@/lib/utils/format-percentage';
import { exportProjectsPdf } from '@/lib/utils/export-pdf';
import type { ProjectListItem } from '@/types/app.types';
import * as XLSX from 'xlsx';

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-3.5 border-b border-slate-200/40 dark:border-slate-800/40">
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-32" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20 ml-auto" />
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

  const handleExportExcel = useCallback(() => {
    const rows = projects.map((p) => ({
      'PO Number': p.po_number,
      'Project Name': p.project_name ?? '—',
      'Client': p.client ?? '—',
      'Vertical': p.vertical ?? '—',
      'PO Value (₹)': p.po_value ?? 0,
      'Total Resources': p.resource_count,
      'Active Resources': p.active_resource_count,
      'Revenue (₹)': p.total_revenue,
      'Cost (₹)': p.total_cost,
      'GM%': Number(p.gross_margin_pct.toFixed(2)),
      'Start Date': p.start_date ?? '—',
      'End Date': p.end_date ?? 'Ongoing',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 16 }, { wch: 24 }, { wch: 18 }, { wch: 14 },
      { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 18 },
      { wch: 16 }, { wch: 8 }, { wch: 14 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');

    const metaWs = XLSX.utils.json_to_sheet([
      { Report: 'OpsHive — Projects Report' },
      { Report: `Generated: ${new Date().toLocaleString('en-IN')}` },
      { Report: `Total Projects: ${projects.length}` },
    ]);
    XLSX.utils.book_append_sheet(wb, metaWs, 'Meta');

    XLSX.writeFile(wb, `OpsHive_Projects_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [projects]);

  const handleExportPdf = useCallback(() => {
    exportProjectsPdf(
      projects.map((p) => ({
        po_number: p.po_number,
        project_name: p.project_name,
        client: p.client,
        resource_count: p.resource_count,
        total_revenue: p.total_revenue,
        gross_margin_pct: p.gross_margin_pct,
      }))
    );
  }, [projects]);

  if (error) return (
    <div className="p-6">
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm">{error}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projects / POs</h1>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-sm">{projects.length} projects</span>
          {!loading && projects.length > 0 && (
            <ExportDropdown
              onExportExcel={handleExportExcel}
              onExportPdf={handleExportPdf}
            />
          )}
        </div>
      </div>

      <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/60">
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
                    className="hover:bg-slate-100/30 dark:bg-slate-800/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-orange-300 transition-colors">{proj.project_name ?? proj.po_number}</p>
                      <p className="text-xs text-slate-500">{proj.po_number}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{proj.client ?? '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{proj.vertical ?? '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300 font-medium">{formatCurrency(proj.po_value)}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-900 dark:text-white">{proj.active_resource_count}</span>
                      <span className="text-xs text-slate-500"> / {proj.resource_count} total</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300">{formatCurrency(proj.total_revenue)}</td>
                    <td className="px-5 py-3.5 text-sm font-medium">
                      <span className={proj.gross_margin_pct >= 30 ? 'text-emerald-400' : proj.gross_margin_pct >= 0 ? 'text-amber-400' : 'text-rose-400'}>
                        {formatPercentage(proj.gross_margin_pct)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${isActive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-slate-700/60 text-slate-500 dark:text-slate-400 border-slate-600/40'}`}>
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
