import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** List skeleton that mirrors the card layout of `ExpenseCard`. */
export function ExpenseListSkeleton() {
  return (
    <View style={styles.container}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.topRow}>
            <Skeleton style={styles.avatar} />
            <View style={styles.identity}>
              <Skeleton style={styles.title} />
              <Skeleton style={styles.subtitle} />
            </View>
            <Skeleton style={styles.badge} />
          </View>
          <View style={styles.bottomRow}>
            <Skeleton style={styles.date} />
            <Skeleton style={styles.amount} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    minHeight: 44,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  identity: { flex: 1, gap: 4 },
  title: { height: 18, width: '70%' },
  subtitle: { height: 12, width: '50%' },
  badge: { width: 90, height: 22, borderRadius: 11 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: { height: 12, width: '30%' },
  amount: { height: 18, width: '40%' },
});
