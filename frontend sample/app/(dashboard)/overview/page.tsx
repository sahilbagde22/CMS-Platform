'use client';

import { mockKPIData, mockChartData, mockActivity } from '@/lib/mockData';
import OverviewView from '@/components/dashboard/OverviewView';

export default function OverviewPage() {
  return <OverviewView kpiData={mockKPIData} chartData={mockChartData} recentActivity={mockActivity} />;
}
