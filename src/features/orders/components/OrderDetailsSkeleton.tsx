import { StyleSheet, View } from 'react-native';

import { Card, Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** Loading placeholder for the order-details screen (card-per-section). */
export function OrderDetailsSkeleton() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Skeleton width="60%" height={22} />
        <Skeleton width="40%" height={22} />
        <View style={styles.badges}>
          <Skeleton width={90} height={24} radius={12} />
          <Skeleton width={80} height={24} radius={12} />
        </View>
      </Card>
      <Card style={styles.card}>
        <Skeleton lines={3} />
      </Card>
      <Card style={styles.card}>
        <Skeleton lines={4} />
      </Card>
      <Card style={styles.card}>
        <Skeleton lines={3} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  card: { gap: spacing.sm },
  badges: { flexDirection: 'row', gap: spacing.sm },
});
