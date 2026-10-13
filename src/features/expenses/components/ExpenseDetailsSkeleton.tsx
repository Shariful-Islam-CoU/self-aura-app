import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** Detail skeleton that mirrors the section layout of the expense detail screen. */
export function ExpenseDetailsSkeleton() {
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
        <Skeleton style={styles.block} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  section: { gap: spacing.md },
  sectionTitle: { height: 18, width: '40%' },
  row: { height: 16, width: '100%' },
  block: { height: 60, width: '100%' },
});
