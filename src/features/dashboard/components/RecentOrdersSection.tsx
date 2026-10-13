import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Card, SectionHeader, Skeleton, Text } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/feedback';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';
import { resolveStatusTone } from '@/theme/status';
import type { RecentOrder } from '../types';

/**
 * Recent-orders preview (backend returns a small ordered slice only).
 * Permission gate lives in the dashboard screen: this component renders
 * data it is given and never fetches on its own.
 */
export function RecentOrdersSection({
  orders,
  isLoading,
  error,
  onRetry,
  onOpenOrder,
  onSeeAll,
}: {
  orders: RecentOrder[] | undefined;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onOpenOrder?: (orderId: string) => void;
  onSeeAll?: () => void;
}) {
  const { theme } = useTheme();

  let body: React.ReactNode;
  if (error && !orders) {
    body = <ErrorState message={error} onRetry={onRetry} />;
  } else if (isLoading && !orders) {
    body = <Skeleton height={72} />;
  } else if (!orders || orders.length === 0) {
    body = <EmptyState title="No orders yet" description="New orders will appear here." />;
  } else {
    body = orders.map((order, index) => {
      const row = (
        <>
          <View style={styles.info}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {order.orderNumber}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {order.customerName} · {formatDate(order.date)}
            </Text>
          </View>
          <View style={styles.meta}>
            <Text variant="bodyMedium">{formatCurrency(order.total)}</Text>
            <Badge label={order.status} tone={resolveStatusTone(order.status)} />
          </View>
        </>
      );
      const style = [
        styles.row,
        index > 0 && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border,
        },
      ];
      const label = `Order ${order.orderNumber}, ${order.customerName}, ${formatCurrency(order.total)}, ${order.status}`;

      return onOpenOrder ? (
        <Pressable
          key={order.id}
          style={style}
          onPress={() => onOpenOrder(order.id)}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          {row}
        </Pressable>
      ) : (
        <View key={order.id} style={style} accessibilityLabel={label}>
          {row}
        </View>
      );
    });
  }

  return (
    <View>
      <SectionHeader
        title="Recent orders"
        actionLabel={onSeeAll ? 'See all' : undefined}
        onAction={onSeeAll}
      />
      <Card style={styles.card}>{body}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  info: { flex: 1, gap: 2 },
  meta: { alignItems: 'flex-end', gap: spacing.xs },
});
