import { StyleSheet, View } from 'react-native';

import { Card, Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** Initial-load placeholder: a stack of courier-card skeletons. */
export function CourierListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={styles.card}>
          <Skeleton width="50%" height={16} />
          <Skeleton width="70%" height={12} />
          <View style={styles.badges}>
            <Skeleton width={70} height={22} radius={11} />
          </View>
        </Card>
      ))}
    </View>
  );
}

/** Loading placeholder for the courier-details screen. */
export function CourierDetailsSkeleton() {
  return (
    <View style={styles.details}>
      <Card style={styles.card}>
        <Skeleton width="55%" height={22} />
        <View style={styles.badges}>
          <Skeleton width={80} height={22} radius={11} />
        </View>
      </Card>
      <Card style={styles.card}>
        <Skeleton lines={4} />
      </Card>
      <Card style={styles.card}>
        <Skeleton lines={2} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  details: { gap: spacing.lg },
  card: { gap: spacing.sm },
  badges: { flexDirection: 'row', gap: spacing.sm },
});
