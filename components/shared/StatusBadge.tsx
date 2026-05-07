import type { DeploymentStatus } from '@/lib/constants/status';

type EmployeeStatusBadge = 'Active' | 'Inactive';
type BadgeStatus = DeploymentStatus | EmployeeStatusBadge;

const BADGE_STYLES: Record<string, string> = {
  Active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Bench: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  Completed: 'bg-slate-700/60 text-slate-400 border-slate-600/40',
  Deployed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Inactive: 'bg-slate-700/60 text-slate-500 border-slate-600/40',
};

const BADGE_DOT: Record<string, string> = {
  Active: 'bg-emerald-400',
  Bench: 'bg-amber-400',
  Completed: 'bg-slate-500',
  Deployed: 'bg-emerald-400',
  Inactive: 'bg-slate-500',
};

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const style = BADGE_STYLES[status] ?? 'bg-slate-700/60 text-slate-400 border-slate-600/40';
  const dot = BADGE_DOT[status] ?? 'bg-slate-500';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${status === 'Active' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  );
}
