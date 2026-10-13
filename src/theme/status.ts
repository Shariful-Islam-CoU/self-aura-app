/**
 * Semantic status tones.
 *
 * The generic `Badge`/`StatusBadge` components only know HOW to render a
 * tone (solid/soft/outline); they never hardcode business statuses. Future
 * features map their domain statuses (order/payment/inventory/return) onto
 * these tones - explicitly in the feature's own mapper, or through the
 * keyword heuristic below when a loose fallback is good enough.
 *
 * `StatusTone` lives in the theme layer (not in `Badge.tsx`) so both the
 * components and future feature mappers can depend on it without importing
 * UI.
 */
export type StatusTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Keyword -> tone rules, evaluated in order (most specific/negative first
 * so "cancelled" never lands on a positive tone). Matching is a case-
 * insensitive substring test against the status label.
 */
const TONE_RULES: readonly (readonly [StatusTone, readonly string[]])[] = [
  [
    'danger',
    [
      'cancelled',
      'canceled',
      'rejected',
      'failed',
      'expired',
      'disabled',
      'out of stock',
      'overdue',
    ],
  ],
  [
    'success',
    [
      'delivered',
      'completed',
      'approved',
      'verified',
      'refunded',
      'received',
      'paid',
      'enabled',
      'in stock',
      'active',
    ],
  ],
  ['warning', ['pending', 'low stock', 'partially', 'awaiting', 'on hold']],
  [
    'info',
    ['shipped', 'processing', 'submitted', 'requested', 'confirmed', 'scheduled', 'in progress'],
  ],
];

/**
 * Heuristic tone for a free-form status label ("Pending" -> `warning`,
 * "Out of stock" -> `danger`, unknown -> `neutral`).
 *
 * This is intentionally only a fallback for display: features that need a
 * precise mapping declare it themselves next to their status definitions.
 */
export function resolveStatusTone(status: string): StatusTone {
  const value = status.trim().toLowerCase();
  for (const [tone, keywords] of TONE_RULES) {
    if (keywords.some((keyword) => value.includes(keyword))) return tone;
  }
  return 'neutral';
}
