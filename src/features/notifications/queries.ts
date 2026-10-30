import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  notificationsApi,
  type NotificationListData,
} from '@/api/notifications';

/** Matches the backend default page size and its `limit` ceiling of 100. */
export const NOTIFICATIONS_PAGE_SIZE = 20;

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (unreadOnly: boolean) =>
    ['notifications', 'list', unreadOnly] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

/**
 * Paginated inbox. The unread filter is part of the query key, so switching
 * between All and Unread never mixes cached rows from the other view.
 */
export function useNotificationsInfinite(unreadOnly = false) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: ({ pageParam }) =>
      notificationsApi.listInbox({
        page: pageParam,
        limit: NOTIFICATIONS_PAGE_SIZE,
        unread: unreadOnly,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: NotificationListData) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
  });
}

/** Backend-computed unread count; never derived from loaded pages. */
export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled,
    staleTime: 30_000,
  });
}

function invalidateInbox(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

/** Marks one event read; the server remains the source of truth. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => invalidateInbox(queryClient),
  });
}

/** Marks every unread event read, then refreshes list and badge. */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => invalidateInbox(queryClient),
  });
}
