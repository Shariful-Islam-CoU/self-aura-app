import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** List skeleton that mirrors the card layout of `PurchaseCard`. */
export function PurchaseListSkeleton() {
  return (
    <View style={styles.container}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.topRow}>
            <Skeleton style={styles.avatar} />
            <View style={styles.identity}>
              <Skeleton style={styles.number} />
            </View>
            <Skeleton style={styles.badge} />
          </View>
          <View style={styles.bottomRow}>
            <Skeleton style={styles.items} />
            <Skeleton style={styles.total} />
            <Skeleton style={styles.date} />
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
  identity: { flex: 1, gap: 2 },
  number: { height: 18, width: '60%' },
  badge: { width: 80, height: 22, borderRadius: 11 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  items: { height: 12, width: '30%' },
  total: { height: 18, width: '40%' },
  date: { height: 12, width: '30%' },
});
