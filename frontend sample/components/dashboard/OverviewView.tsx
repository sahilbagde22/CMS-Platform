'use client';

import KPICard from '@/components/shared/KPICard';
import Card from '@/components/shared/Card';
import ChartWrapper from '@/components/charts/ChartWrapper';
import { KPI, ChartPoint, Activity } from '@/lib/types';
import { Clock } from 'lucide-react';

interface OverviewViewProps {
  kpiData: KPI[];
  chartData: ChartPoint[];
  recentActivity: Activity[];
}

export default function OverviewView({
  kpiData,
  chartData,
  recentActivity,
}: OverviewViewProps) {
  // Chart options for ECharts
  const chartOption = {
    color: ['#4f46e5', '#ef4444'],
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['Revenue', 'Cost'],
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 40,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: chartData.map((d) => d.month),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: 'Revenue',
        data: chartData.map((d) => d.revenue),
        type: 'line',
        areaStyle: {
          color: 'rgba(79, 70, 229, 0.1)',
        },
        smooth: true,
        itemStyle: {
          color: '#4f46e5',
        },
      },
      {
        name: 'Cost',
        data: chartData.map((d) => d.cost),
        type: 'line',
        areaStyle: {
          color: 'rgba(239, 68, 68, 0.1)',
        },
        smooth: true,
        itemStyle: {
          color: '#ef4444',
        },
      },
    ],
  };

  const formatActivityTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="space-y-6 p-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <KPICard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            trend={kpi.trend}
            trendDirection={kpi.trendDirection}
            unit={kpi.unit}
          />
        ))}
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue vs Cost Chart */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Revenue vs Cost</h2>
            <ChartWrapper option={chartOption} />
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="flex flex-col p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h2>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex gap-3 border-b border-gray-100 pb-4 last:border-b-0"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                  <Clock size={16} className="text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.description}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatActivityTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
