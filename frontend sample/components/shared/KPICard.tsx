'use client';

import Card from './Card';
import TrendBadge from './TrendBadge';

export default function KPICard({
  label,
  value,
  trend,
  trendDirection,
  unit = '',
}: {
  label: string;
  value: string | number;
  trend: number;
  trendDirection: 'up' | 'down';
  unit?: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <TrendBadge trend={trend} direction={trendDirection} />
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
        </div>
      </div>
    </Card>
  );
}
