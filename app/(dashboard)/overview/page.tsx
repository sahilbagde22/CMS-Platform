'use client';

import { useEffect, useState } from 'react';
import {
  Users, TrendingUp, TrendingDown, DollarSign,
  BarChart3, Clock, Upload
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MetricCard } from '@/components/shared/MetricCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency } from '@/lib/utils/format-currency';
import { formatPercentage } from '@/lib/utils/format-percentage';
import type { OverviewData } from '@/types/app.types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// Skeleton shimmer
function SkeletonCard() {
  return (
    <div className="p-5 bg-slate-900/50 border border-slate-800/60 rounded-2xl animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-slate-800 mb-3" />
      <div className="h-7 w-24 bg-slate-800 rounded mb-2" />
      <div className="h-3 w-16 bg-slate-800 rounded" />
    </div>
  );
}

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="bg-slate-900/50 border border-slate-800/60 rounded-2xl animate-pulse"
      style={{ height }}
    />
  );
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [deptData, setDeptData] = useState<{
    department: string;
    deployed_count: number;
    bench_count: number;
    headcount: number;
    total_revenue: number;
    gross_margin_pct: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [overviewRes, deptRes] = await Promise.all([
          fetch('/api/overview'),
          fetch('/api/departments'),
        ]);

        const overviewJson = await overviewRes.json();
        const deptJson = await deptRes.json();

        if (!overviewRes.ok || !overviewJson.success) {
          if (overviewRes.status === 404) {
            setData(null);
            setLoading(false);
            return;
          }
          throw new Error(overviewJson.error ?? 'Failed to load overview');
        }

        setData(overviewJson.data);
        if (deptJson.success) setDeptData(deptJson.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-rose-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Upload}
          title="No data yet"
          description="Upload your Excel file with Employee_Master, Project_Master, and Deployment_Log sheets to get started."
          ctaLabel="Upload Excel File"
          ctaHref="/upload"
        />
      </div>
    );
  }

  const deploymentPieOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      orient: 'vertical', right: 10, top: 'center',
      textStyle: { color: '#94a3b8', fontSize: 12 },
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      data: [
        { value: data.deployed_count, name: 'Deployed', itemStyle: { color: '#10b981' } },
        { value: data.bench_count, name: 'Bench', itemStyle: { color: '#f59e0b' } },
        {
          value: data.total_employees - data.deployed_count - data.bench_count,
          name: 'Inactive',
          itemStyle: { color: '#475569' },
        },
      ],
    }],
  };

  const revenueBarOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0];
        return `${p.name}<br/>₹${new Intl.NumberFormat('en-IN').format(p.value)}`;
      },
    },
    grid: { left: 16, right: 16, top: 16, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: deptData.map((d) => d.department),
      axisLabel: { color: '#64748b', fontSize: 11, rotate: 30 },
      axisLine: { lineStyle: { color: '#1e293b' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748b', fontSize: 11,
        formatter: (v: number) => `₹${(v / 100000).toFixed(0)}L`,
      },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [{
      type: 'bar',
      data: deptData.map((d) => d.total_revenue),
      itemStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#8b5cf6' }, { offset: 1, color: '#6d28d9' }] },
        borderRadius: [4, 4, 0, 0],
      },
    }],
  };

  const gmBarOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', formatter: (params: { name: string; value: number }[]) => `${params[0].name}<br/>${params[0].value.toFixed(1)}%` },
    grid: { left: 16, right: 16, top: 16, bottom: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: deptData.map((d) => d.department),
      axisLabel: { color: '#64748b', fontSize: 11, rotate: 30 },
      axisLine: { lineStyle: { color: '#1e293b' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#64748b', fontSize: 11, formatter: (v: number) => `${v}%` },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [{
      type: 'bar',
      data: deptData.map((d) => ({
        value: d.gross_margin_pct,
        itemStyle: {
          color: d.gross_margin_pct >= 30 ? '#10b981' : d.gross_margin_pct >= 0 ? '#f59e0b' : '#f43f5e',
          borderRadius: [4, 4, 0, 0],
        },
      })),
    }],
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Company Overview</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Last updated:{' '}
            {data.last_uploaded_at
              ? new Date(data.last_uploaded_at).toLocaleString('en-IN')
              : '—'}
          </p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-violet-500/20"
        >
          <Upload className="w-4 h-4" />
          Upload New
        </Link>
      </div>

      {/* KPI Cards — 6 across on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          label="Total Employees"
          value={data.total_employees}
          icon={Users}
          color="violet"
        />
        <MetricCard
          label="Deployed"
          value={data.deployed_count}
          icon={TrendingUp}
          color="emerald"
          subtitle={formatPercentage(data.overall_deploy_pct) + ' rate'}
        />
        <MetricCard
          label="On Bench"
          value={data.bench_count}
          icon={Clock}
          color="amber"
        />
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(data.total_revenue)}
          icon={DollarSign}
          color="cyan"
        />
        <MetricCard
          label="Total Profit"
          value={formatCurrency(data.total_profit)}
          icon={data.total_profit >= 0 ? TrendingUp : TrendingDown}
          color={data.total_profit >= 0 ? 'emerald' : 'rose'}
        />
        <MetricCard
          label="Overall GM%"
          value={formatPercentage(data.overall_gm_pct)}
          icon={BarChart3}
          color={data.overall_gm_pct >= 30 ? 'emerald' : 'amber'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Deployment Pie */}
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Deployment Status</h2>
          <ReactECharts option={deploymentPieOption} style={{ height: 220 }} />
        </div>

        {/* Revenue by Dept */}
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Revenue by Department</h2>
          {deptData.length > 0
            ? <ReactECharts option={revenueBarOption} style={{ height: 220 }} />
            : <div className="h-[220px] flex items-center justify-center text-slate-600 text-sm">No department data</div>
          }
        </div>

        {/* GM% by Dept */}
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">GM% by Department</h2>
          {deptData.length > 0
            ? <ReactECharts option={gmBarOption} style={{ height: 220 }} />
            : <div className="h-[220px] flex items-center justify-center text-slate-600 text-sm">No department data</div>
          }
        </div>
      </div>
    </div>
  );
}
