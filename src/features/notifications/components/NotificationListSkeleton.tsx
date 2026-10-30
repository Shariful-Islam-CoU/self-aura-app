import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** Initial-load placeholder that mirrors the notification row rhythm. */
export function NotificationListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.row}>
          <Skeleton width={38} height={38} circle />
          <View style={styles.content}>
            <Skeleton width="62%" height={14} />
            <Skeleton width="88%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
    paddingTop: 2,
  },
});
