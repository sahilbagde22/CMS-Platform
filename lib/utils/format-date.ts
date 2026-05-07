/**
 * Formats ISO 8601 date strings for display.
 */
const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return String(value);
    return DATE_FORMATTER.format(date);
  } catch {
    return String(value);
  }
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return String(value);
    return DATE_TIME_FORMATTER.format(date);
  } catch {
    return String(value);
  }
}

export function formatRelativeTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(date);
  } catch {
    return String(value);
  }
}
