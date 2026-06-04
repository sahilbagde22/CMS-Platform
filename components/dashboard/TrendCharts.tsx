'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, History, ChevronDown, ChevronUp } from 'lucide-react';
import type { TrendPoint } from '@/app/api/trends/route';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type MetricKey =
  | 'total_revenue'
  | 'total_profit'
  | 'overall_gm_pct'
  | 'total_employees'
  | 'deployed_count'
  | 'bench_count'
  | 'overall_deploy_pct';

const METRIC_CONFIG: Record<
  MetricKey,
  { label: string; color: string; format: (v: number) => string; unit?: string }
> = {
  total_revenue: {
    label: 'Revenue',
    color: '#8b5cf6',
    format: (v) => `₹${(v / 100000).toFixed(1)}L`,
    unit: '₹ Lakhs',
  },
  total_profit: {
    label: 'Profit',
    color: '#10b981',
    format: (v) => `₹${(v / 100000).toFixed(1)}L`,
    unit: '₹ Lakhs',
  },
  overall_gm_pct: {
    label: 'GM%',
    color: '#f59e0b',
    format: (v) => `${v.toFixed(1)}%`,
    unit: '%',
  },
  total_employees: {
    label: 'Headcount',
    color: '#6366f1',
    format: (v) => v.toString(),
  },
  deployed_count: {
    label: 'Deployed',
    color: '#10b981',
    format: (v) => v.toString(),
  },
  bench_count: {
    label: 'Bench',
    color: '#f59e0b',
    format: (v) => v.toString(),
  },
  overall_deploy_pct: {
    label: 'Deploy Rate',
    color: '#06b6d4',
    format: (v) => `${v.toFixed(1)}%`,
    unit: '%',
  },
};

const CHART_PRESETS: { label: string; metrics: MetricKey[] }[] = [
  { label: 'Financials', metrics: ['total_revenue', 'total_profit'] },
  { label: 'Margins', metrics: ['overall_gm_pct'] },
  { label: 'Workforce', metrics: ['total_employees', 'deployed_count', 'bench_count'] },
  { label: 'Utilization', metrics: ['overall_deploy_pct'] },
];

export function TrendCharts() {
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePreset, setActivePreset] = useState(0);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/trends');
        const json = await res.json();
        if (json.success) setTrends(json.data.trends);
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Don't render if less than 2 data points (no trend to show)
  if (!loading && trends.length < 2) return null;

  if (loading) {
    return (
      <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 animate-pulse">
        <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded mb-4" />
        <div className="h-[260px] bg-slate-100/40 dark:bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  const preset = CHART_PRESETS[activePreset];
  const labels = trends.map((t) => t.label);

  const series = preset.metrics.map((key) => {
    const cfg = METRIC_CONFIG[key];
    return {
      name: cfg.label,
      type: 'line' as const,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: trends.map((t) => t[key]),
      lineStyle: { width: 2.5, color: cfg.color },
      itemStyle: { color: cfg.color },
      areaStyle: preset.metrics.length === 1
        ? {
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: cfg.color + '30' },
                { offset: 1, color: cfg.color + '05' },
              ],
            },
          }
        : undefined,
    };
  });

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: (params: { axisValue: string; seriesName: string; value: number; color: string }[]) => {
        let html = `<div style="font-weight:600;margin-bottom:4px">${params[0]?.axisValue}</div>`;
        for (const p of params) {
          const key = preset.metrics.find((k) => METRIC_CONFIG[k].label === p.seriesName);
          const fmt = key ? METRIC_CONFIG[key].format : (v: number) => v.toString();
          html += `<div style="display:flex;align-items:center;gap:6px;margin-top:2px">
            <span style="width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
            <span>${p.seriesName}: <strong>${fmt(p.value)}</strong></span>
          </div>`;
        }
        return html;
      },
    },
    legend: {
      show: preset.metrics.length > 1,
      bottom: 0,
      textStyle: { color: '#94a3b8', fontSize: 11 },
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: {
      left: 16, right: 16, top: 16,
      bottom: preset.metrics.length > 1 ? 36 : 16,
      containLabel: true,
    },
    xAxis: {
      type: 'category' as const,
      data: labels,
      axisLabel: { color: '#64748b', fontSize: 11 },
      axisLine: { lineStyle: { color: '#1e293b' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        formatter: (v: number) => {
          const mainKey = preset.metrics[0];
          if (mainKey === 'total_revenue' || mainKey === 'total_profit') {
            return `₹${(v / 100000).toFixed(0)}L`;
          }
          if (mainKey === 'overall_gm_pct' || mainKey === 'overall_deploy_pct') {
            return `${v}%`;
          }
          return v.toString();
        },
      },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series,
  };

  return (
    <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 group"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-indigo-500/15">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Historical Trends</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <History className="w-3 h-3" />
              {trends.length} uploads tracked
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-slate-700 dark:text-slate-300 transition-colors">
          {expanded ? (
            <><span>Hide</span><ChevronUp className="w-4 h-4" /></>
          ) : (
            <><span>Show</span><ChevronDown className="w-4 h-4" /></>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-200/60 dark:border-slate-800/60">
          {/* Preset Tabs */}
          <div className="flex items-center gap-1 px-5 pt-4 pb-2">
            {CHART_PRESETS.map((p, idx) => (
              <button
                key={p.label}
                onClick={() => setActivePreset(idx)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${idx === activePreset
                    ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                  }
                `}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="px-5 pb-5">
            <ReactECharts option={chartOption} style={{ height: 260 }} />
          </div>
        </div>
      )}
    </div>
  );
}
