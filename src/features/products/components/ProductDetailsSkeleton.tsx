import { StyleSheet, View } from 'react-native';

import { Card, Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** Loading placeholder for the product-details screen (card-per-section). */
export function ProductDetailsSkeleton() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Skeleton width="60%" height={22} />
        <Skeleton width="45%" height={16} />
        <Skeleton width="80%" height={16} />
        <Skeleton width="35%" height={16} />
      </Card>
      <Card style={styles.card}>
        <Skeleton width="50%" height={16} />
        <Skeleton width="50%" height={16} />
        <Skeleton width="50%" height={16} />
      </Card>
      <Card style={styles.card}>
        <Skeleton width="70%" height={16} />
        <View style={styles.mediaGrid}>
          <Skeleton width="31%" height={104} radius={12} />
          <Skeleton width="31%" height={104} radius={12} />
          <Skeleton width="31%" height={104} radius={12} />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  card: { gap: spacing.sm },
  mediaGrid: { flexDirection: 'row', justifyContent: 'space-between' },
});
