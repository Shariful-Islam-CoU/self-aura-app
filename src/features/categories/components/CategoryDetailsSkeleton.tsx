import { StyleSheet, View } from 'react-native';

import { Card, Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** Loading placeholder for the category-details screen (card-per-section). */
export function CategoryDetailsSkeleton() {
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
        <View style={styles.mediaRow}>
          <Skeleton width={72} height={72} radius={12} />
          <View style={styles.mediaMeta}>
            <Skeleton lines={2} />
          </View>
        </View>
        <View style={styles.mediaRow}>
          <Skeleton width={72} height={72} radius={12} />
          <View style={styles.mediaMeta}>
            <Skeleton lines={2} />
          </View>
        </View>
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
  mediaRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  mediaMeta: { flex: 1, gap: spacing.xs },
});
