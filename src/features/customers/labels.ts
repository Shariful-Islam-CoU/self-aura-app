import type { StatusTone } from '@/theme';

/**
 * Display labels/tones for the customer status (the model's `isActive`
 * flag - the backend exposes no other status dimension). Mapped
 * explicitly per the design-system rule: generic components only know
 * HOW to render a tone, features map their own values. Mirrors the web
 * app's status badge (`Active` = success, `Inactive` = secondary).
 */
export const CUSTOMER_STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
} as const;

export const CUSTOMER_STATUS_TONES: Record<'active' | 'inactive', StatusTone> = {
  active: 'success',
  inactive: 'neutral',
};

export function customerStatusLabel(isActive: boolean): string {
  return isActive ? CUSTOMER_STATUS_LABELS.active : CUSTOMER_STATUS_LABELS.inactive;
}

export function customerStatusTone(isActive: boolean): StatusTone {
  return isActive ? CUSTOMER_STATUS_TONES.active : CUSTOMER_STATUS_TONES.inactive;
}
