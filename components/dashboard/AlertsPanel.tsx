'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Info, XCircle, ChevronDown, ChevronUp,
  Bell, Users, TrendingDown, FolderOpen, BarChart3,
  ExternalLink,
} from 'lucide-react';
import type { Alert, AlertSeverity, AlertCategory, AlertsData } from '@/types/app.types';

// ─── Severity config ──────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<AlertSeverity, {
  icon: React.ElementType;
  label: string;
  badgeCls: string;
  borderCls: string;
  iconCls: string;
  rowHoverCls: string;
}> = {
  critical: {
    icon: XCircle,
    label: 'Critical',
    badgeCls: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
    borderCls: 'border-l-rose-500',
    iconCls: 'text-rose-400',
    rowHoverCls: 'hover:bg-rose-500/5',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    badgeCls: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    borderCls: 'border-l-amber-500',
    iconCls: 'text-amber-400',
    rowHoverCls: 'hover:bg-amber-500/5',
  },
  info: {
    icon: Info,
    label: 'Info',
    badgeCls: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
    borderCls: 'border-l-sky-500',
    iconCls: 'text-sky-400',
    rowHoverCls: 'hover:bg-sky-500/5',
  },
};

// ─── Category icon ────────────────────────────────────────────────────────────
const CATEGORY_ICON: Record<AlertCategory, React.ElementType> = {
  bench: Users,
  margin: TrendingDown,
  project: FolderOpen,
  utilization: BarChart3,
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function AlertRow({ alert }: { alert: Alert }) {
  const sev = SEVERITY_CONFIG[alert.severity];
  const SevIcon = sev.icon;
  const CatIcon = CATEGORY_ICON[alert.category];

  const inner = (
    <div
      className={`
        flex items-start gap-3 px-4 py-3.5 transition-colors
        border-l-2 ${sev.borderCls} ${sev.rowHoverCls}
      `}
    >
      <SevIcon className={`w-4 h-4 shrink-0 mt-0.5 ${sev.iconCls}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-white leading-tight">{alert.title}</p>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${sev.badgeCls}`}>
            <CatIcon className="w-2.5 h-2.5" />
            {alert.category}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{alert.description}</p>
      </div>
      {alert.href && (
        <ExternalLink className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5 group-hover:text-slate-400 transition-colors" />
      )}
    </div>
  );

  if (alert.href) {
    return (
      <Link href={alert.href} className="block group">
        {inner}
      </Link>
    );
  }
  return inner;
}

function SummaryBadge({ count, severity }: { count: number; severity: AlertSeverity }) {
  if (count === 0) return null;
  const cfg = SEVERITY_CONFIG[severity];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.badgeCls}`}>
      <Icon className="w-3 h-3" />
      {count} {cfg.label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AlertsPanel() {
  const [data, setData] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch('/api/alerts');
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {
        // Silently fail — alerts are non-critical UI
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  // Don't render if loading or no alerts
  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-5 animate-pulse">
        <div className="h-4 w-40 bg-slate-800 rounded mb-3" />
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-12 bg-slate-800/60 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data || data.total === 0) return null;

  const hasCritical = data.critical_count > 0;

  return (
    <div
      className={`
        rounded-2xl border overflow-hidden transition-all
        ${hasCritical
          ? 'bg-rose-950/20 border-rose-500/20'
          : 'bg-amber-950/10 border-amber-500/15'
        }
      `}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 group"
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${hasCritical ? 'bg-rose-500/20' : 'bg-amber-500/15'}`}>
            <Bell className={`w-4 h-4 ${hasCritical ? 'text-rose-400' : 'text-amber-400'}`} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">
              {data.total} Operational Alert{data.total !== 1 ? 's' : ''}
            </span>
            <SummaryBadge count={data.critical_count} severity="critical" />
            <SummaryBadge count={data.warning_count} severity="warning" />
            <SummaryBadge count={data.info_count} severity="info" />
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-slate-300 transition-colors shrink-0">
          {collapsed ? (
            <><span>Show</span><ChevronDown className="w-4 h-4" /></>
          ) : (
            <><span>Hide</span><ChevronUp className="w-4 h-4" /></>
          )}
        </div>
      </button>

      {/* Alert list */}
      {!collapsed && (
        <div
          className={`
            border-t divide-y
            ${hasCritical
              ? 'border-rose-500/15 divide-rose-500/10'
              : 'border-amber-500/10 divide-amber-500/8'
            }
          `}
        >
          {data.alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
