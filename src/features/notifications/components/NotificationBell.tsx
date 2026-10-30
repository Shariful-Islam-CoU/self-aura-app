import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { IconButton, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { useUnreadNotificationCount } from '../queries';

/**
 * Home header bell with a backend-counted unread badge. The count is never
 * derived from the paginated inbox, so it remains correct before the list is
 * opened or after only the first page has loaded.
 */
export function NotificationBell() {
  const { theme } = useTheme();
  const unreadQuery = useUnreadNotificationCount();
  const count = unreadQuery.data ?? 0;
  const label = count > 0 ? `Notifications, ${count} unread` : 'Notifications';

  return (
    <View style={styles.wrap}>
      <IconButton
        icon="notifications-outline"
        accessibilityLabel={label}
        onPress={() => router.push('/notifications')}
      />
      {count > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.background,
            },
          ]}
        >
          <Text variant="caption" style={[styles.badgeText, { color: theme.colors.onPrimary }]}>
            {count > 99 ? '99+' : String(count)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
});
