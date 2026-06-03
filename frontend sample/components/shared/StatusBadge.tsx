'use client';

import Badge from './Badge';

export default function StatusBadge({
  status,
}: {
  status: 'deployed' | 'bench' | 'leave';
}) {
  const variants = {
    deployed: { label: 'Deployed', variant: 'success' as const },
    bench: { label: 'Bench', variant: 'warning' as const },
    leave: { label: 'Leave', variant: 'error' as const },
  };

  const { label, variant } = variants[status];

  return <Badge variant={variant}>{label}</Badge>;
}
