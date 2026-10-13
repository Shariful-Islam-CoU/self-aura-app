import { StyleSheet, View } from 'react-native';

import { Card, Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** Loading placeholder for the customer-details screen (card-per-section). */
export function CustomerDetailsSkeleton() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Skeleton width="60%" height={22} />
        <Skeleton width="40%" height={16} />
        <Skeleton width="75%" height={16} />
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
});
