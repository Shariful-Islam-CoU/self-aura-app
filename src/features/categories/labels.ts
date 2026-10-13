import type { StatusTone } from '@/theme';

/**
 * Display labels/tones for the category status (the model's `isActive`
 * flag - the backend exposes no other status dimension). Mapped explicitly
 * per the design-system rule: generic components only know HOW to render a
 * tone, features map their own values. Mirrors the web app's status badge
 * (`Active` = success, `Inactive` = secondary/neutral).
 */
export const CATEGORY_STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
} as const;

export const CATEGORY_STATUS_TONES: Record<'active' | 'inactive', StatusTone> = {
  active: 'success',
  inactive: 'neutral',
};

export function categoryStatusLabel(isActive: boolean): string {
  return isActive ? CATEGORY_STATUS_LABELS.active : CATEGORY_STATUS_LABELS.inactive;
}

export function categoryStatusTone(isActive: boolean): StatusTone {
  return isActive ? CATEGORY_STATUS_TONES.active : CATEGORY_STATUS_TONES.inactive;
}

/**
 * Media-storage provenance badge, like the web's "Stored"/"External" pill:
 * `managed` assets live in the media library and are deleted when replaced
 * or removed; legacy `external` URLs were uploaded before the library
 * existed, so replacing them never deletes the old file.
 */
export function mediaStorageLabel(managed: boolean): string {
  return managed ? 'Stored' : 'External';
}
