import type { StatusTone } from '@/theme';

import type { InventoryStockStatus, StockMovement, StockTransactionType } from './types';

/**
 * Display labels/tones for the inventory domain. Generic components only
 * know HOW to render a tone; this file maps the backend's values, exactly
 * like `features/products/labels.ts`.
 *
 * The stock status rule mirrors the web badge
 * (`self_aura_frontend/.../InventoryStatusBadge.tsx`), which documents it
 * from `reportRepository.getInventoryTotals` and the dashboard low-stock
 * widget: out of stock when stock is 0, low stock when stock is at or below
 * `lowStockThreshold`, otherwise in stock. It is a DISPLAY AID - the
 * backend computes every stock figure and the low-stock list itself.
 */

export function getStockStatus(stock: number, lowStockThreshold: number): InventoryStockStatus {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

const STOCK_STATUS_LABELS: Record<InventoryStockStatus, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

const STOCK_STATUS_TONES: Record<InventoryStockStatus, StatusTone> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'danger',
};

export function stockStatusLabel(status: InventoryStockStatus): string {
  return STOCK_STATUS_LABELS[status];
}

export function stockStatusTone(status: InventoryStockStatus): StatusTone {
  return STOCK_STATUS_TONES[status];
}

/** One-call helpers mirroring the web badge usage. */
export function stockStatusFromProduct(
  stock: number,
  lowStockThreshold: number,
): { label: string; tone: StatusTone } {
  const status = getStockStatus(stock, lowStockThreshold);
  return { label: stockStatusLabel(status), tone: stockStatusTone(status) };
}

/** Movement type -> human label (web `StockMovementTable` copy). */
export const MOVEMENT_TYPE_LABELS: Record<StockTransactionType, string> = {
  stock_in: 'Stock In',
  stock_out: 'Stock Out',
  adjustment: 'Adjustment',
  return_in: 'Return In',
  return_out: 'Return Out',
};

/** Movement type -> tone (in = success, out = danger, else neutral). */
export const MOVEMENT_TYPE_TONES: Record<StockTransactionType, StatusTone> = {
  stock_in: 'success',
  stock_out: 'danger',
  adjustment: 'info',
  return_in: 'neutral',
  return_out: 'neutral',
};

/** Unknown types (backend extension) fall back to the raw value. */
export function movementTypeLabel(type: StockMovement['type']): string {
  return MOVEMENT_TYPE_LABELS[type] ?? type;
}

export function movementTypeTone(type: StockMovement['type']): StatusTone {
  return MOVEMENT_TYPE_TONES[type] ?? 'neutral';
}

/** Reason value -> label (all nine `INVENTORY_REASONS`, web copy). */
export const REASON_LABELS: Record<string, string> = {
  initial_stock: 'Initial stock',
  restock: 'Restock',
  removal: 'Removal',
  manual_adjustment: 'Manual adjustment',
  damaged: 'Damaged',
  lost: 'Lost',
  returned: 'Returned',
  correction: 'Correction',
  purchase: 'Purchase',
};

/**
 * Label for any stored reason. Manual adjustments accept free text
 * (1-100 chars), so unknown values are prettified rather than shown raw -
 * and unknown enum values from a future backend still render sensibly.
 */
export function reasonLabel(reason: string): string {
  const known = REASON_LABELS[reason];
  if (known) return known;
  const pretty = reason.replace(/_/g, ' ').trim();
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}

/**
 * Signed quantity display (web parity): `+N` for stock-in movements, `-N`
 * for stock-out, plain `N` for adjustments (the movement stores the delta
 * magnitude, the sign comes from the direction type).
 */
export function movementQuantityLabel(movement: StockMovement): string {
  if (movement.type === 'stock_in' || movement.type === 'return_in') {
    return `+${movement.quantity}`;
  }
  if (movement.type === 'stock_out' || movement.type === 'return_out') {
    return `-${movement.quantity}`;
  }
  return String(movement.quantity);
}

/**
 * The manual-adjustment reasons offered by the web dialog
 * (`StockAdjustmentDialog.tsx`) - a subset of the backend's reason enum,
 * sent as the raw value so the stored data matches the web app exactly.
 */
export const ADJUST_REASONS: readonly { value: string; label: string }[] = [
  { value: 'manual_adjustment', label: 'Manual adjustment' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'lost', label: 'Lost' },
  { value: 'returned', label: 'Returned' },
  { value: 'correction', label: 'Correction' },
  { value: 'removal', label: 'Removal' },
];

/** Label for a reason selected from `ADJUST_REASONS`. */
export function adjustReasonLabel(value: string): string {
  return ADJUST_REASONS.find((reason) => reason.value === value)?.label ?? reasonLabel(value);
}
