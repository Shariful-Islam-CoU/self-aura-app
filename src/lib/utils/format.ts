/**
 * Formatting helpers shared by mobile app components.
 */

/** Format an amount as BDT currency (the brand's operating currency). */
export function formatPrice(value: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `৳${formatted}`;
}

export { formatPrice as formatAmount };