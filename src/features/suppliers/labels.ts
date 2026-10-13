import type { StatusTone } from '@/theme';

/**
 * Display labels/tones for the supplier status (the model's `isActive`
 * flag - the backend exposes no other status dimension). Mapped
 * explicitly per the design-system rule: generic components only know
 * HOW to render a tone, features map their own values. Mirrors the web
 * app's status badge (`Active` = success, `Inactive` = secondary).
 */
export const SUPPLIER_STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
} as const;

export const SUPPLIER_STATUS_TONES: Record<'active' | 'inactive', StatusTone> = {
  active: 'success',
  inactive: 'neutral',
};

export function supplierStatusLabel(isActive: boolean): string {
  return isActive ? SUPPLIER_STATUS_LABELS.active : SUPPLIER_STATUS_LABELS.inactive;
}

export function supplierStatusTone(isActive: boolean): StatusTone {
  return isActive ? SUPPLIER_STATUS_TONES.active : SUPPLIER_STATUS_TONES.inactive;
}

/** Purchase status labels/tones mirrored from web PurchaseStatusBadge. */
export const PURCHASE_STATUS_LABELS: Record<'draft' | 'received' | 'cancelled', string> = {
  draft: 'Draft',
  received: 'Received',
  cancelled: 'Cancelled',
};

export const PURCHASE_STATUS_TONES: Record<'draft' | 'received' | 'cancelled', StatusTone> = {
  draft: 'warning',
  received: 'success',
  cancelled: 'danger',
};

export function purchaseStatusLabel(status: 'draft' | 'received' | 'cancelled'): string {
  return PURCHASE_STATUS_LABELS[status];
}

export function purchaseStatusTone(status: 'draft' | 'received' | 'cancelled'): StatusTone {
  return PURCHASE_STATUS_TONES[status];
}

/** Sort labels for the list toolbar. */
export const SUPPLIER_SORT_LABELS: Record<string, string> = {
  'createdAt:desc': 'Newest first',
  'createdAt:asc': 'Oldest first',
  'name:asc': 'Name A-Z',
  'name:desc': 'Name Z-A',
  'phone:asc': 'Phone A-Z',
  'phone:desc': 'Phone Z-A',
};

/** Filter status options. */
export const SUPPLIER_STATUS_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active only' },
  { value: 'inactive', label: 'Inactive only' },
] as const;

export type SupplierStatusFilter = 'all' | 'active' | 'inactive';
