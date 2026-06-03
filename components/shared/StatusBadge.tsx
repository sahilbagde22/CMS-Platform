'use client';

import Badge from './Badge';

export function StatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  if (!status) return <Badge variant="default">Unknown</Badge>;

  const normalized = status.toLowerCase();
  let variant: 'default' | 'success' | 'warning' | 'error' | 'info' = 'default';

  if (['active', 'deployed', 'ongoing', 'success'].includes(normalized)) {
    variant = 'success';
  } else if (['inactive', 'closed', 'error', 'failed', 'leave'].includes(normalized)) {
    variant = 'error';
  } else if (['bench', 'pending', 'warning'].includes(normalized)) {
    variant = 'warning';
  } else {
    variant = 'default';
  }

  return <Badge variant={variant}>{status}</Badge>;
}
