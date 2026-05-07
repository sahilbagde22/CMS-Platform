import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: number; // positive = up, negative = down
  color?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose';
  className?: string;
}

const COLOR_MAP = {
  violet: {
    bg: 'from-violet-500/15 to-violet-600/5 border-violet-500/20',
    icon: 'text-violet-400',
    iconBg: 'bg-violet-500/10 border-violet-500/20',
  },
  cyan: {
    bg: 'from-cyan-500/15 to-cyan-600/5 border-cyan-500/20',
    icon: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  emerald: {
    bg: 'from-emerald-500/15 to-emerald-600/5 border-emerald-500/20',
    icon: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  amber: {
    bg: 'from-amber-500/15 to-amber-600/5 border-amber-500/20',
    icon: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/20',
  },
  rose: {
    bg: 'from-rose-500/15 to-rose-600/5 border-rose-500/20',
    icon: 'text-rose-400',
    iconBg: 'bg-rose-500/10 border-rose-500/20',
  },
};

export function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'violet',
  className = '',
}: MetricCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <div
      className={`relative p-5 bg-gradient-to-br ${colors.bg} border rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01] ${className}`}
    >
      {/* Subtle glow */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-white/[0.01] rounded-2xl" />

      <div className="flex items-start justify-between mb-3">
        {Icon && (
          <div className={`w-9 h-9 rounded-xl ${colors.iconBg} border flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${colors.icon}`} />
          </div>
        )}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-white tracking-tight mb-0.5">{value}</p>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
