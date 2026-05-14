import type { LucideIcon } from 'lucide-react';
import { Upload } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyState({
  icon: Icon = Upload,
  title,
  description,
  ctaLabel,
  ctaHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-300/60 dark:border-slate-700/60 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-500" />
      </div>
      <h3 className="text-slate-900 dark:text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-sm mb-6">{description}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-slate-900 dark:text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-orange-500/20"
        >
          {ctaLabel} →
        </Link>
      )}
    </div>
  );
}
