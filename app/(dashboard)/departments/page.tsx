'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Upload } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/utils/format-currency';
import { formatPercentage } from '@/lib/utils/format-percentage';
import type { DepartmentListItem } from '@/types/app.types';

function SkeletonCard() {
  return <div className="h-44 bg-slate-900/50 border border-slate-800/60 rounded-2xl animate-pulse" />;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (error) return (
    <div className="p-6">
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm">{error}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-white">Departments</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map((dept) => {
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
                className="block p-5 bg-slate-900/50 border border-slate-800/60 rounded-2xl hover:border-violet-500/30 hover:bg-slate-900/80 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-white group-hover:text-violet-300 transition-colors">
                      {dept.department}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">{dept.headcount} employees</p>
                  </div>
                  <Building2 className="w-5 h-5 text-slate-600 group-hover:text-violet-500 transition-colors" />
                </div>

                {/* Deployed / Bench bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Deployed: {dept.deployed_count}</span>
                    <span>Bench: {dept.bench_count}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${Math.min(dept.deployment_pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 text-right">{formatPercentage(dept.deployment_pct)} deployed</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/60">
                  <div>
                    <p className="text-xs text-slate-500">Revenue</p>
                    <p className="text-sm font-semibold text-white">{formatCurrency(dept.total_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">GM%</p>
                    <p className={`text-sm font-semibold ${gmColor}`}>{formatPercentage(dept.gross_margin_pct)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
