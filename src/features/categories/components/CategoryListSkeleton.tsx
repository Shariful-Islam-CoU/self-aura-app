import { StyleSheet, View } from 'react-native';

import { Card, Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** Initial-load placeholder: a stack of category-card skeletons. */
export function CategoryListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={styles.card}>
          <View style={styles.topRow}>
            <Skeleton width={52} height={52} radius={12} />
            <View style={styles.identity}>
              <Skeleton width="55%" height={16} />
              <Skeleton width="75%" height={12} />
              <Skeleton width="40%" height={12} />
            </View>
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
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  identity: { flex: 1, gap: spacing.xs },
});
