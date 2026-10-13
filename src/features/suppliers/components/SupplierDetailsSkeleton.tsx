import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** Detail skeleton that mirrors the section layout of the supplier detail screen. */
export function SupplierDetailsSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Skeleton style={styles.sectionTitle} />
        <Skeleton style={styles.row} />
        <Skeleton style={styles.row} />
        <Skeleton style={styles.row} />
        <Skeleton style={styles.row} />
      </View>
      <View style={styles.section}>
        <Skeleton style={styles.sectionTitle} />
        <Skeleton style={styles.row} />
        <Skeleton style={styles.row} />
        <Skeleton style={styles.row} />
      </View>
      <View style={styles.section}>
        <Skeleton style={styles.sectionTitle} />
        <Skeleton style={styles.row} />
        <Skeleton style={styles.row} />
      </View>
      <View style={styles.section}>
        <Skeleton style={styles.sectionTitle} />
        <Skeleton style={styles.row} />
      </View>
      <View style={styles.section}>
        <Skeleton style={styles.sectionTitle} />
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} style={styles.historyRow} />
        ))}
      </View>
      <View style={styles.section}>
        <Skeleton style={styles.sectionTitle} />
        <Skeleton style={styles.row} />
        <Skeleton style={styles.row} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  section: { gap: spacing.md },
  sectionTitle: { height: 18, width: '40%' },
  row: { height: 16, width: '100%' },
  historyRow: { height: 40, width: '100%' },
});
