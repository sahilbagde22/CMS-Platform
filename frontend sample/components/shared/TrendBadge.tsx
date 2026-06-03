'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';

export default function TrendBadge({
  trend,
  direction,
  className = '',
}: {
  trend: number;
  direction: 'up' | 'down';
  className?: string;
}) {
  const isPositive = direction === 'up';
  const color = isPositive ? 'text-green-600' : 'text-red-600';
  const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';
  const icon = isPositive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;

  return (
    <div className={`inline-flex items-center gap-1 rounded-lg ${bgColor} px-2 py-1 ${color} ${className}`}>
      {icon}
      <span className="text-xs font-semibold">{Math.abs(trend)}%</span>
    </div>
  );
}
