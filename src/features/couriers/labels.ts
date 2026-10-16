import type { StatusTone } from '@/theme';

/**
 * A courier's status is the backend boolean `isActive` - there is no status
 * enum and no reactivation endpoint (deactivation is one-way). Labels mirror
 * the web client so both render identical text.
 */
export function courierStatusLabel(isActive: boolean): string {
  return isActive ? 'Active' : 'Inactive';
}

export function courierStatusTone(isActive: boolean): StatusTone {
  return isActive ? 'success' : 'neutral';
}
