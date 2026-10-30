import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { getErrorMessage } from '@/api';
import type { InboxNotification } from '@/api/notifications';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Chip, IconButton } from '@/components/ui';
import { NotificationListSkeleton } from '@/features/notifications/components/NotificationListSkeleton';
import { NotificationRow } from '@/features/notifications/components/NotificationRow';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsInfinite,
  useUnreadNotificationCount,
} from '@/features/notifications/queries';
import { resolveNotificationRoute } from '@/features/notifications/routes';
import { useToast, useTheme } from '@/providers';
import { spacing } from '@/theme';

/**
 * Staff notification centre.
 *
 * Every row is a persisted backend event; there is no local/demo data. The
 * list is paginated, can be filtered to unread, and read state is per-user on
 * the server. Tapping a row marks it read and opens the related order/payment.
 */
export default function NotificationsScreen() {
  const { theme } = useTheme();
  const toast = useToast();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const listQuery = useNotificationsInfinite(unreadOnly);
  const unreadQuery = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data]
  );
  const unreadCount = unreadQuery.data ?? 0;
  const unreadInView = items.some((notification) => !notification.isRead);
  const canMarkAll = unreadQuery.isSuccess ? unreadCount > 0 : unreadInView;

  const openNotification = (notification: InboxNotification) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }

    const route = resolveNotificationRoute(notification.data);
    if (route) {
      router.push(route);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const header = (
    <AppHeader
      variant="feature"
      title="Notifications"
      onBack={() => router.back()}
      actions={
        <IconButton
          icon="checkmark-done-outline"
          accessibilityLabel="Mark all notifications as read"
          disabled={!canMarkAll || markAllRead.isPending}
          onPress={() => void handleMarkAll()}
        />
      }
    />
  );

  let content: ReactNode;
  if (listQuery.isPending && items.length === 0) {
    content = <NotificationListSkeleton />;
  } else if (listQuery.isError && items.length === 0) {
    content = (
      <ErrorState
        title="Failed to load notifications"
        message={getErrorMessage(listQuery.error)}
        onRetry={() => void listQuery.refetch()}
        retryLabel="Retry"
      />
    );
  } else {
    content = (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationRow notification={item} onPress={openNotification} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching && !listQuery.isFetchingNextPage}
            onRefresh={() => void listQuery.refetch()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={() => {
          if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
            void listQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <EmptyState
            icon={unreadOnly ? 'checkmark-done-circle-outline' : 'notifications-off-outline'}
            title={unreadOnly ? "You're all caught up" : 'No notifications yet'}
            description={
              unreadOnly
                ? 'No unread notifications right now.'
                : 'New orders, manual payments and cancellations will appear here.'
            }
          />
        }
        ListFooterComponent={
          listQuery.hasNextPage && listQuery.isFetchingNextPage ? (
            <NotificationListSkeleton count={2} />
          ) : null
        }
      />
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      {header}

      <View style={styles.toolbar}>
        <Chip
          label="All"
          selected={!unreadOnly}
          onPress={() => setUnreadOnly(false)}
        />
        <Chip
          label={
            unreadQuery.isSuccess && unreadCount > 0
              ? `Unread (${unreadCount})`
              : 'Unread'
          }
          selected={unreadOnly}
          onPress={() => setUnreadOnly(true)}
        />
      </View>

      <View style={styles.content}>{content}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    flexGrow: 1, // keeps pull-to-refresh available on an empty inbox
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
