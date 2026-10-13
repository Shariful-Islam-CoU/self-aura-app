import type { StatusTone } from '@/theme';
import { type PurchaseStatus } from '@/features/purchases/constants';

/**
 * Display labels/tones for purchase statuses. Mapped explicitly per the
 * design-system rule: generic components only know HOW to render a tone,
 * features map their own values. Mirrors the web app's PurchaseStatusBadge.
 */
export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  draft: 'Draft',
  received: 'Received',
  cancelled: 'Cancelled',
};

export const PURCHASE_STATUS_TONES: Record<PurchaseStatus, StatusTone> = {
  draft: 'warning',
  received: 'success',
  cancelled: 'danger',
};

export function purchaseStatusLabel(status: PurchaseStatus): string {
  return PURCHASE_STATUS_LABELS[status];
}

export function purchaseStatusTone(status: PurchaseStatus): StatusTone {
  return PURCHASE_STATUS_TONES[status];
}

/** Sort labels for the list toolbar. */
export const PURCHASE_SORT_LABELS: Record<string, string> = {
  'createdAt:desc': 'Newest first',
  'createdAt:asc': 'Oldest first',
  'purchaseDate:desc': 'Date newest',
  'purchaseDate:asc': 'Date oldest',
  'total:desc': 'Total high-low',
  'total:asc': 'Total low-high',
  'purchaseNumber:desc': 'Number high-low',
  'purchaseNumber:asc': 'Number low-high',
};

/** Filter status options. */
export const PURCHASE_STATUS_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export type PurchaseStatusFilter = 'all' | 'draft' | 'received' | 'cancelled';
