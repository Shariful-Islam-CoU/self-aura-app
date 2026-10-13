import type { StatusTone } from '@/theme';
import type { DeliveryFailureReason, ShipmentStatus } from './types';

/**
 * Display labels and precise tone mappings for shipment domain statuses.
 *
 * Defined here (not in the UI layer) per the design system rule: generic
 * components only know HOW to render a tone, features map their own statuses.
 * Labels mirror `self_aura_frontend`'s ShipmentStatusBadge so both clients
 * render identical text for the same data.
 */

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: 'Pending',
  ready_to_ship: 'Ready to ship',
  shipped: 'Shipped',
  in_transit: 'In transit',
  delivered: 'Delivered',
  delivery_failed: 'Delivery failed',
  returned_to_seller: 'Returned to seller',
  cancelled: 'Cancelled',
};

export const DELIVERY_FAILURE_REASON_LABELS: Record<DeliveryFailureReason, string> = {
  customer_unavailable: 'Customer unavailable',
  wrong_address: 'Wrong address',
  customer_refused: 'Customer refused',
  phone_unreachable: 'Phone unreachable',
  courier_issue: 'Courier issue',
  other: 'Other',
};

/** Explicit status -> tone mapping (never relies on keyword guessing). */
export const SHIPMENT_STATUS_TONES: Record<ShipmentStatus, StatusTone> = {
  pending: 'warning',
  ready_to_ship: 'info',
  shipped: 'info',
  in_transit: 'info',
  delivered: 'success',
  delivery_failed: 'danger',
  returned_to_seller: 'neutral',
  cancelled: 'neutral',
};

/**
 * Short consequence note for terminal statuses - shown instead of a
 * fabricated timeline (the status history comes from the real event log).
 */
export const TERMINAL_STATUS_NOTES: Partial<Record<ShipmentStatus, string>> = {
  delivered: 'This shipment has been delivered.',
  returned_to_seller: 'This shipment was returned to the seller.',
  cancelled: 'This shipment was cancelled.',
};
