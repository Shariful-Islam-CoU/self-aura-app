import { StyleSheet, View } from 'react-native';

import { Card, Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** Loading placeholder for the inventory-details screen (card-per-section). */
export function InventoryDetailsSkeleton() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Skeleton width="60%" height={22} />
        <Skeleton width="45%" height={16} />
        <Skeleton width="80%" height={16} />
      </Card>
      <Card style={styles.card}>
        <Skeleton width="50%" height={16} />
        <Skeleton width="50%" height={16} />
        <Skeleton width="50%" height={16} />
        <Skeleton width="50%" height={16} />
      </Card>
      <Card style={styles.card}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="100%" height={44} radius={10} />
        <Skeleton width="100%" height={44} radius={10} />
      </Card>
      <Card style={styles.card}>
        <Skeleton width="55%" height={16} />
        <Skeleton width="100%" height={64} radius={10} />
        <Skeleton width="100%" height={64} radius={10} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  card: { gap: spacing.sm },
});
