import { StyleSheet, View } from 'react-native';

import { Card, Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** Initial-load placeholder: a stack of inventory-card skeletons. */
export function InventoryListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={styles.card}>
          <View style={styles.row}>
            <Skeleton width={56} height={56} radius={12} />
            <View style={styles.identity}>
              <Skeleton width="55%" height={16} />
              <Skeleton width="70%" height={12} />
              <Skeleton width="40%" height={12} />
            </View>
            <View style={styles.side}>
              <Skeleton width={72} height={22} radius={11} />
              <Skeleton width={64} height={16} />
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identity: { flex: 1, gap: spacing.xs },
  side: { alignItems: 'flex-end', gap: spacing.xs },
});
