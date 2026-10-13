import { StyleSheet, View } from 'react-native';

import { Card, Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

export function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} style={styles.kpi}>
            <Skeleton height={60} />
          </Card>
        ))}
      </View>
      <Card>
        <Skeleton height={120} />
      </Card>
      <Card>
        <Skeleton height={80} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  // Screen already applies horizontal padding - only vertical rhythm here.
  container: { gap: spacing.lg },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  kpi: { flexGrow: 1, flexBasis: '45%' },
});
