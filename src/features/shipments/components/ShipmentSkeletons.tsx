import { StyleSheet, View } from 'react-native';

import { Card, Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** Initial-load placeholder: a stack of shipment-card skeletons. */
export function ShipmentListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={styles.card}>
          <Skeleton width="55%" height={16} />
          <Skeleton width="75%" height={12} />
          <View style={styles.badges}>
            <Skeleton width={80} height={22} radius={11} />
            <Skeleton width={110} height={22} radius={11} />
          </View>
        </Card>
      ))}
    </View>
  );
}

/** Loading placeholder for the shipment-details screen (card-per-section). */
export function ShipmentDetailsSkeleton() {
  return (
    <View style={styles.details}>
      <Card style={styles.card}>
        <Skeleton width="60%" height={22} />
        <Skeleton width="40%" height={22} />
        <View style={styles.badges}>
          <Skeleton width={90} height={24} radius={12} />
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
  container: { gap: spacing.md },
  details: { gap: spacing.lg },
  card: { gap: spacing.sm },
  badges: { flexDirection: 'row', gap: spacing.sm },
});
