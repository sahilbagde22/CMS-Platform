'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users, TrendingUp, TrendingDown, DollarSign,
  BarChart3, Clock, Upload
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import KPICard from '@/components/shared/KPICard';
import Card from '@/components/shared/Card';
import ChartWrapper from '@/components/charts/ChartWrapper';
import { EmptyState } from '@/components/shared/EmptyState';
import { ExportDropdown } from '@/components/shared/ExportDropdown';
import { AiInsights } from '@/components/dashboard/AiInsights';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { TrendCharts } from '@/components/dashboard/TrendCharts';
import { formatCurrency } from '@/lib/utils/format-currency';
import { exportOverview } from '@/lib/utils/export-excel';
import { exportOverviewPdf } from '@/lib/utils/export-pdf';

import { formatPercentage } from '@/lib/utils/format-percentage';
import type { OverviewData } from '@/types/app.types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// Skeleton shimmer
function SkeletonCard() {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 w-32 bg-gray-200 rounded"></div>
      </div>
    </Card>
  );
}

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <Card className="p-6">
      <div className="w-full bg-gray-200 rounded animate-pulse" style={{ height }} />
    </Card>
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
    total_cost: number;
    total_profit: number;
    deployment_pct: number;
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

  const handleExportExcel = useCallback(() => {
    if (!data) return;
    exportOverview(
      {
        total_employees: data.total_employees,
        deployed_count: data.deployed_count,
        bench_count: data.bench_count,
        overall_deploy_pct: data.overall_deploy_pct,
        total_revenue: data.total_revenue,
        total_cost: data.total_cost,
        total_profit: data.total_profit,
        overall_gm_pct: data.overall_gm_pct,
        last_uploaded_at: data.last_uploaded_at,
      },
      deptData.map((d) => ({
        department: d.department,
        headcount: d.headcount,
        deployed_count: d.deployed_count,
        bench_count: d.bench_count,
        deployment_pct: d.deployment_pct ?? 0,
        total_revenue: d.total_revenue,
        total_cost: d.total_cost ?? 0,
        total_profit: d.total_profit ?? 0,
        gross_margin_pct: d.gross_margin_pct,
      }))
    );
  }, [data, deptData]);

  const handleExportPdf = useCallback(() => {
    if (!data) return;
    exportOverviewPdf(
      {
        total_employees: data.total_employees,
        deployed_count: data.deployed_count,
        bench_count: data.bench_count,
        overall_deploy_pct: data.overall_deploy_pct,
        total_revenue: data.total_revenue,
        total_cost: data.total_cost,
        total_profit: data.total_profit,
        overall_gm_pct: data.overall_gm_pct,
        last_uploaded_at: data.last_uploaded_at,
      },
      deptData.map((d) => ({
        department: d.department,
        headcount: d.headcount,
        deployed_count: d.deployed_count,
        bench_count: d.bench_count,
        deployment_pct: d.deployment_pct ?? 0,
        total_revenue: d.total_revenue,
        total_profit: d.total_profit ?? 0,
        gross_margin_pct: d.gross_margin_pct,
      }))
    );
  }, [data, deptData]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Company Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Last updated:{' '}
            {data.last_uploaded_at
              ? new Date(data.last_uploaded_at).toLocaleString('en-IN')
              : '—'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
          />
          <Link
            href="/upload"
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-slate-900 dark:text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-orange-500/20"
          >
            <Upload className="w-4 h-4" />
            Upload New
          </Link>
        </div>
      </div>

      {/* AI Executive Summary */}
      <AiInsights />

      {/* Smart Alerts */}
      <AlertsPanel />

      {/* Historical Trend Charts */}
      <TrendCharts />

      {/* KPI Cards — 6 across on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        <KPICard
          label="Total Employees"
          value={data.total_employees}
          trend={data.trends?.employees}
          trendDirection={(data.trends?.employees ?? 0) >= 0 ? 'up' : 'down'}
        />
        <KPICard
          label="Deployed"
          value={data.deployed_count}
          trend={data.trends?.deployed}
          trendDirection={(data.trends?.deployed ?? 0) >= 0 ? 'up' : 'down'}
        />
        <KPICard
          label="On Bench"
          value={data.bench_count}
          trend={data.trends?.bench ? -data.trends.bench : undefined}
          trendDirection={data.trends?.bench && data.trends.bench < 0 ? 'up' : 'down'}
        />
        <KPICard
          label="Total Revenue"
          value={formatCurrency(data.total_revenue)}
          trend={data.trends?.revenue}
          trendDirection={(data.trends?.revenue ?? 0) >= 0 ? 'up' : 'down'}
        />
        <KPICard
          label="Total Profit"
          value={formatCurrency(data.total_profit)}
          trend={data.trends?.profit}
          trendDirection={(data.trends?.profit ?? 0) >= 0 ? 'up' : 'down'}
        />
        <KPICard
          label="Overall GM%"
          value={formatPercentage(data.overall_gm_pct)}
          trend={data.trends?.gm}
          trendDirection={(data.trends?.gm ?? 0) >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deployment Pie */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Deployment Status</h2>
          <ChartWrapper option={deploymentPieOption} style={{ height: 220 }} />
        </Card>

        {/* Revenue by Dept */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Revenue by Department</h2>
          {deptData.length > 0
            ? <ChartWrapper option={revenueBarOption} style={{ height: 220 }} />
            : <div className="h-[220px] flex items-center justify-center text-slate-600 text-sm">No department data</div>
          }
        </Card>

        {/* GM% by Dept */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">GM% by Department</h2>
          {deptData.length > 0
            ? <ChartWrapper option={gmBarOption} style={{ height: 220 }} />
            : <div className="h-[220px] flex items-center justify-center text-slate-600 text-sm">No department data</div>
          }
        </Card>
      </div>
    </div>
  );
}
