/**
 * Format a number as a percentage string.
 * Handles null/undefined gracefully.
 */
export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(decimals)}%`;
}
