import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui';
import { spacing } from '@/theme';

/** List skeleton that mirrors the card layout of `SupplierCard`. */
export function SupplierListSkeleton() {
  return (
    <View style={styles.container}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.topRow}>
            <Skeleton style={styles.avatar} />
            <View style={styles.identity}>
              <Skeleton style={styles.name} />
              <Skeleton style={styles.phone} />
            </View>
            <Skeleton style={styles.badge} />
          </View>
          <Skeleton style={styles.address} />
          <Skeleton style={styles.date} />
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
  name: { height: 18, width: '60%' },
  phone: { height: 12, width: '40%' },
  badge: { width: 80, height: 22, borderRadius: 11 },
  address: { height: 12, width: '50%', marginTop: spacing.sm },
  date: { height: 12, width: '30%', marginTop: spacing.sm },
});
