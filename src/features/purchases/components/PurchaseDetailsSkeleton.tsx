import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** Detail skeleton that mirrors the section layout of the purchase detail screen. */
export function PurchaseDetailsSkeleton() {
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
      </View>
      <View style={styles.section}>
        <Skeleton style={styles.sectionTitle} />
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} style={styles.itemRow} />
        ))}
      </View>
      <View style={styles.section}>
        <Skeleton style={styles.sectionTitle} />
        <Skeleton style={styles.totalRow} />
        <Skeleton style={styles.totalRow} />
        <Skeleton style={styles.totalRow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  section: { gap: spacing.md },
  sectionTitle: { height: 18, width: '40%' },
  row: { height: 16, width: '100%' },
  itemRow: { height: 40, width: '100%' },
  totalRow: { height: 20, width: '50%' },
});
