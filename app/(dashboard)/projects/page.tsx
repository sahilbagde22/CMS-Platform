'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FolderKanban, Upload, Search } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import Card from '@/components/shared/Card';
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

function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('q') || '');

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

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);

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

  const filtered = useMemo(() => {
    if (!search) return projects;
    const q = search.toLowerCase();
    return projects.filter(p =>
      p.po_number.toLowerCase().includes(q) ||
      (p.project_name && p.project_name.toLowerCase().includes(q)) ||
      (p.client && p.client.toLowerCase().includes(q))
    );
  }, [projects, search]);

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
          <span className="text-slate-500 text-sm">{filtered.length} projects</span>
          {!loading && projects.length > 0 && (
            <ExportDropdown
              onExportExcel={handleExportExcel}
              onExportPdf={handleExportPdf}
            />
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects, clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 w-64 shadow-sm"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {['Project', 'Client', 'Vertical', 'PO Value', 'Resources', 'Revenue', 'GM%', 'Status'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && filtered.map((proj) => {
                const isActive = proj.end_date ? new Date(proj.end_date) > new Date() : true;
                return (
                  <tr
                    key={proj.id}
                    onClick={() => router.push(`/projects/${proj.po_number}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{proj.project_name ?? proj.po_number}</p>
                      <p className="text-xs text-gray-500">{proj.po_number}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{proj.client ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{proj.vertical ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{formatCurrency(proj.po_value)}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{proj.active_resource_count}</span>
                      <span className="text-xs text-gray-500"> / {proj.resource_count} total</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(proj.total_revenue)}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <span className={proj.gross_margin_pct >= 30 ? 'text-emerald-500' : proj.gross_margin_pct >= 0 ? 'text-amber-500' : 'text-rose-500'}>
                        {formatPercentage(proj.gross_margin_pct)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
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
      </Card>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}
