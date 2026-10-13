import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** List skeleton that mirrors the card layout of `PaymentCard`. */
export function PaymentListSkeleton() {
  return (
    <View style={styles.container}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.identity}>
              <Skeleton style={styles.number} />
              <Skeleton style={styles.subtitle} />
            </View>
            <Skeleton style={styles.badge} />
          </View>
          <View style={styles.metaRow}>
            <Skeleton style={styles.pill} />
            <Skeleton style={styles.pill} />
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
  identity: { flex: 1, gap: 4 },
  number: { height: 18, width: '45%' },
  subtitle: { height: 12, width: '65%' },
  badge: { width: 88, height: 22, borderRadius: 11 },
  metaRow: { flexDirection: 'row', gap: spacing.xs },
  pill: { width: 80, height: 22, borderRadius: 11 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: { height: 12, width: '30%' },
  amount: { height: 20, width: '35%' },
});
