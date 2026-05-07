'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Upload, Search } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/utils/format-currency';
import { formatPercentage } from '@/lib/utils/format-percentage';
import type { EmployeeListItem } from '@/types/app.types';

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-3.5 border-b border-slate-800/40">
          <div className="h-4 bg-slate-800 rounded w-24" />
          <div className="h-4 bg-slate-800 rounded w-20" />
          <div className="h-4 bg-slate-800 rounded w-28" />
          <div className="h-4 bg-slate-800 rounded w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortCol, setSortCol] = useState<'name' | 'total_revenue' | 'gross_margin_pct'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (filterDept) params.set('department', filterDept);
        if (filterStatus) params.set('status', filterStatus);
        const res = await fetch(`/api/employees?${params}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setEmployees(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filterDept, filterStatus]);

  const departments = useMemo(() => [...new Set(employees.map((e) => e.department))].sort(), [employees]);

  const filtered = useMemo(() => {
    let result = employees;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.emp_id.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      if (sortCol === 'name') { va = a.name; vb = b.name; }
      else if (sortCol === 'total_revenue') { va = a.metrics?.total_revenue ?? 0; vb = b.metrics?.total_revenue ?? 0; }
      else if (sortCol === 'gross_margin_pct') { va = a.metrics?.gross_margin_pct ?? 0; vb = b.metrics?.gross_margin_pct ?? 0; }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [employees, search, sortCol, sortAsc]);

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortAsc((v) => !v);
    else { setSortCol(col); setSortAsc(true); }
  };

  const SortIndicator = ({ col }: { col: typeof sortCol }) =>
    sortCol === col ? <span className="ml-1">{sortAsc ? '↑' : '↓'}</span> : null;

  if (error) return (
    <div className="p-6">
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm">{error}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Employees</h1>
        <span className="text-slate-500 text-sm">{filtered.length} of {employees.length} employees</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search name, ID, dept…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 w-64"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50"
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800/60">
                {[
                  { label: 'Name', col: 'name' as const },
                  { label: 'Department', col: null },
                  { label: 'Designation', col: null },
                  { label: 'Status', col: null },
                  { label: 'Revenue', col: 'total_revenue' as const },
                  { label: 'GM%', col: 'gross_margin_pct' as const },
                  { label: 'Deploy Status', col: null },
                ].map(({ label, col }) => (
                  <th
                    key={label}
                    onClick={() => col && toggleSort(col)}
                    className={`text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3 ${col ? 'cursor-pointer hover:text-slate-300 select-none' : ''}`}
                  >
                    {label}{col && <SortIndicator col={col} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {loading
                ? null
                : filtered.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => router.push(`/employees/${emp.emp_id}`)}
                      className="hover:bg-slate-800/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.emp_id}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">{emp.department}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">{emp.designation ?? '—'}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={emp.status} /></td>
                      <td className="px-5 py-3.5 text-sm text-slate-300 font-medium">{formatCurrency(emp.metrics?.total_revenue)}</td>
                      <td className="px-5 py-3.5 text-sm font-medium">
                        <span className={`${(emp.metrics?.gross_margin_pct ?? 0) >= 30 ? 'text-emerald-400' : (emp.metrics?.gross_margin_pct ?? 0) >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {formatPercentage(emp.metrics?.gross_margin_pct)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {emp.metrics ? <StatusBadge status={emp.metrics.deployment_status} /> : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {loading && <TableSkeleton />}
        </div>
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={Users}
            title="No employees found"
            description="No employees match your filters or no data has been uploaded yet."
            ctaLabel="Upload Excel File"
            ctaHref="/upload"
          />
        )}
      </div>
    </div>
  );
}
