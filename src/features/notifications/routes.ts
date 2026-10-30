import type { Href } from 'expo-router';

import type { NotificationData } from '@/api/notifications';

const asId = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

/**
 * Resolves an inbox event or push payload to an internal route.
 *
 * The backend deliberately sends domain ids, not app paths: the storefront and
 * future web client can use the same data without inheriting mobile routing.
 */
export function resolveNotificationRoute(
  data?: NotificationData | Record<string, unknown> | null
): Href | null {
  if (!data) return null;

  const payload = data as NotificationData;
  const url = asId(payload.url);
  if (url && url.startsWith('/') && !url.startsWith('//')) {
    return url as Href;
  }

  const paymentId = asId(payload.paymentId);
  if (paymentId) {
    return `/payments/${paymentId}` as Href;
  }

  const orderId = asId(payload.orderId);
  if (orderId) {
    return `/orders/${orderId}` as Href;
  }

  return null;
}
