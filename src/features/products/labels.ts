import type { StatusTone } from '@/theme';

/**
 * Display labels/tones for the product status (the model's `isActive` flag -
 * the backend exposes no other status dimension; there is no
 * published/draft/archived enum). Mapped explicitly per the design-system
 * rule: generic components only know HOW to render a tone, features map their
 * own values. Mirrors the web app's status badge (`Active` = success,
 * `Inactive` = secondary/neutral).
 */
export const PRODUCT_STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
} as const;

export const PRODUCT_STATUS_TONES: Record<'active' | 'inactive', StatusTone> = {
  active: 'success',
  inactive: 'neutral',
};

export function productStatusLabel(isActive: boolean): string {
  return isActive ? PRODUCT_STATUS_LABELS.active : PRODUCT_STATUS_LABELS.inactive;
}

export function productStatusTone(isActive: boolean): StatusTone {
  return isActive ? PRODUCT_STATUS_TONES.active : PRODUCT_STATUS_TONES.inactive;
}

/**
 * Media-storage provenance badge, like the web's "Stored"/"External" pill:
 * `managed` assets live in the media library and are deleted physically when
 * replaced or removed; legacy `external` URLs were recorded before the
 * library existed, so manipulating them never touches a stored file.
 */
export function mediaStorageLabel(managed: boolean): string {
  return managed ? 'Stored' : 'External';
}
