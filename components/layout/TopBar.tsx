'use client';

import { usePathname } from 'next/navigation';

const ROUTE_LABELS: Record<string, string> = {
  '/overview': 'Overview',
  '/employees': 'Employees',
  '/departments': 'Departments',
  '/projects': 'Projects',
  '/upload': 'Upload Data',
};

function getBreadcrumb(pathname: string): string {
  for (const [prefix, label] of Object.entries(ROUTE_LABELS)) {
    if (pathname.startsWith(prefix)) return label;
  }
  return 'OpsHive';
}

export function TopBar() {
  const pathname = usePathname();
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <header className="h-14 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-semibold">{breadcrumb}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Phase 1
        </span>
      </div>
    </header>
  );
}
