'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, Upload, Search } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import Card from '@/components/shared/Card';
import { ExportDropdown } from '@/components/shared/ExportDropdown';
import { formatCurrency } from '@/lib/utils/format-currency';
import { formatPercentage } from '@/lib/utils/format-percentage';
import { exportDepartments } from '@/lib/utils/export-excel';
import { exportDepartmentsPdf } from '@/lib/utils/export-pdf';
import type { DepartmentListItem } from '@/types/app.types';

function SkeletonCard() {
  return <Card className="h-44 animate-pulse bg-gray-100" />;
}

export default function DepartmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('q') || '');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/departments');
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setDepartments(json.data);
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
    exportDepartments(
      departments.map((d) => ({
        department: d.department,
        headcount: d.headcount,
        deployed_count: d.deployed_count,
        bench_count: d.bench_count,
        deployment_pct: d.deployment_pct,
        total_revenue: d.total_revenue,
        total_cost: d.total_cost,
        total_profit: d.total_profit,
        gross_margin_pct: d.gross_margin_pct,
      }))
    );
  }, [departments]);

  const handleExportPdf = useCallback(() => {
    exportDepartmentsPdf(
      departments.map((d) => ({
        department: d.department,
        headcount: d.headcount,
        deployed_count: d.deployed_count,
        bench_count: d.bench_count,
        deployment_pct: d.deployment_pct,
        total_revenue: d.total_revenue,
        total_profit: d.total_profit,
        gross_margin_pct: d.gross_margin_pct,
      }))
    );
  }, [departments]);

  const filtered = useMemo(() => {
    if (!search) return departments;
    const q = search.toLowerCase();
    return departments.filter(d =>
      d.department.toLowerCase().includes(q)
    );
  }, [departments, search]);

  if (error) return (
    <div className="p-6">
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm">{error}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Departments</h1>
        {!loading && departments.length > 0 && (
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
          />
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 w-64 shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No department data"
          description="Upload your Excel file to see department metrics."
          ctaLabel="Upload Data"
          ctaHref="/upload"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No results found"
          description={`No departments match the search query "${search}".`}
          ctaLabel="Clear Search"
          ctaHref="/departments"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((dept) => {
            const gmColor =
              dept.gross_margin_pct >= 30
                ? 'text-emerald-400'
                : dept.gross_margin_pct >= 0
                  ? 'text-amber-400'
                  : 'text-rose-400';

            return (
              <Link
                key={dept.department}
                href={`/departments/${encodeURIComponent(dept.department)}`}
                className="block group"
              >
                <Card className="p-6 transition-all hover:scale-[1.01] hover:shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-orange-300 transition-colors">
                      {dept.department}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">{dept.headcount} employees</p>
                  </div>
                  <Building2 className="w-5 h-5 text-slate-600 group-hover:text-orange-500 transition-colors" />
                </div>

                {/* Deployed / Bench bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Deployed: {dept.deployed_count}</span>
                    <span>Bench: {dept.bench_count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${Math.min(dept.deployment_pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 text-right">{formatPercentage(dept.deployment_pct)} deployed</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div>
                    <p className="text-xs text-slate-500">Revenue</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(dept.total_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">GM%</p>
                    <p className={`text-sm font-semibold ${gmColor}`}>{formatPercentage(dept.gross_margin_pct)}</p>
                  </div>
                </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
