import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { notificationsApi, type NotificationData } from '@/api/notifications';
import { useAuth } from '@/providers';
import { notificationKeys } from '../queries';
import { resolveNotificationRoute } from '../routes';

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null;

/**
 * Central push observer.
 *
 * - A foreground push invalidates the inbox and unread badge.
 * - A tap (cold start, background, or foreground) marks the persisted event
 *   read, refreshes the badge and routes to the domain screen.
 *
 * It waits for a real authenticated session, so a push that launches the app
 * can still be applied after login/session restore.
 */
export function useNotificationObserver() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledResponseId = useRef<string | null>(null);

  // Clearing the response resets the guard, so tapping the same notification
  // again later (same request identifier) is handled again.
  useEffect(() => {
    if (lastResponse == null) {
      handledResponseId.current = null;
    }
  }, [lastResponse]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      if (!isAuthenticated) return;
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });

    return () => subscription.remove();
  }, [isAuthenticated, queryClient]);

  useEffect(() => {
    if (!lastResponse || !isAuthenticated) return;

    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      Notifications.clearLastNotificationResponse();
      return;
    }

    const requestId = lastResponse.notification.request.identifier;
    if (handledResponseId.current === requestId) return;
    handledResponseId.current = requestId;

    const data = asRecord(
      lastResponse.notification.request.content.data
    ) as NotificationData | null;
    const notificationId =
      typeof data?.notificationId === 'string' ? data.notificationId : null;
    const route = resolveNotificationRoute(data) ?? '/notifications';

    if (notificationId) {
      // Navigation must not wait for the read receipt; a failed receipt should
      // not block the user from opening the event.
      void (async () => {
        try {
          await notificationsApi.markRead(notificationId);
        } catch {
          // The row stays unread; the next inbox refresh reconciles it.
        }
        void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      })();
    } else {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }

    router.push(route, { withAnchor: true });
    Notifications.clearLastNotificationResponse();
  }, [lastResponse, isAuthenticated, queryClient]);
}
