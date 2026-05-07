/**
 * Format a number as INR currency.
 * Uses en-IN locale with INR currency style.
 * Handles null/undefined gracefully.
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format large numbers with Indian comma grouping.
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN').format(value);
}
