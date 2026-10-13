import { StyleSheet, View } from 'react-native';

import { Card, Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** Initial-load placeholder: a stack of order-card skeletons. */
export function OrderListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={styles.card}>
          <Skeleton width="55%" height={16} />
          <Skeleton width="75%" height={12} />
          <View style={styles.badges}>
            <Skeleton width={80} height={22} radius={11} />
            <Skeleton width={70} height={22} radius={11} />
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  card: { gap: spacing.sm },
  badges: { flexDirection: 'row', gap: spacing.sm },
});
