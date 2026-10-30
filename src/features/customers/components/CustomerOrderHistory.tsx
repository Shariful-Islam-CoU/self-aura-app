import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { Badge, Button, Skeleton, Text } from '@/components/ui';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
} from '@/features/orders/labels';
import { OrderContactSheet } from '@/features/orders/components/OrderContactSheet';
import type { Order } from '@/features/orders/types';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import { flattenCustomerOrders, useCustomerOrderHistory } from '../queries';
import { DetailRow, SectionCard } from './SectionCard';

/**
 * Backend-provided per-customer figures plus the order history itself -
 * both come from the ONE `GET /orders?customer=…` response (there is no
 * dedicated per-customer statistics endpoint): `pagination.total` is the
 * backend's order count, and the newest row (sorted createdAt desc) gives
 * the last order date. No totals or averages are computed on the client.
 *
 * Tapping a row opens the existing Order Details screen from Step 9 with
 * only the `orderId` - orders are never duplicated here.
 */
export function CustomerOrderHistory({
  customerId,
  canViewOrders,
}: {
  customerId: string;
  canViewOrders: boolean;
}) {
  const historyQuery = useCustomerOrderHistory(customerId, canViewOrders);
  const orders = flattenCustomerOrders(historyQuery.data?.pages);
  const totalOrders = historyQuery.data?.pages[0]?.pagination.total;
  const newestOrder = orders[0];
  const [contactOrder, setContactOrder] = useState<Order | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  if (!canViewOrders) {
    return (
      <SectionCard title="Order history">
        <Text variant="bodySmall" tone="muted">
          You don&apos;t have permission to view this customer&apos;s orders.
        </Text>
      </SectionCard>
    );
  }

  if (historyQuery.isPending) {
    return (
      <View style={styles.container}>
        <SectionCard title="Statistics">
          <Skeleton width="60%" height={16} />
          <Skeleton width="45%" height={16} />
        </SectionCard>
        <SectionCard title="Order history">
          <Skeleton lines={3} />
        </SectionCard>
      </View>
    );
  }

  if (historyQuery.isError && orders.length === 0) {
    const error = historyQuery.error;
    const isForbidden = isApiError(error) && error.kind === 'authorization';
    return (
      <View style={styles.container}>
        <SectionCard title="Statistics">
          <Text variant="bodySmall" tone="muted">
            {isForbidden
              ? "You don't have permission to view this customer's orders."
              : 'Statistics are unavailable right now.'}
          </Text>
        </SectionCard>
        {!isForbidden ? (
          <ErrorState
            title="Failed to load order history"
            message={getErrorMessage(error)}
            onRetry={() => void historyQuery.refetch()}
            retryLabel="Retry"
          />
        ) : null}
      </View>
    );
  }

  const remaining = totalOrders !== undefined ? Math.max(totalOrders - orders.length, 0) : 0;

  return (
    <View style={styles.container}>
      <SectionCard title="Statistics">
        <DetailRow label="Total orders" value={formatNumber(totalOrders ?? 0)} />
        <DetailRow
          label="Last order"
          value={newestOrder ? formatDate(newestOrder.createdAt) : 'No orders yet'}
        />
      </SectionCard>

      <SectionCard title="Order history">
        {orders.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No orders yet"
            description="Orders placed by this customer will appear here."
          />
        ) : (
          <View style={styles.list}>
            {orders.map((order) => (
              <CustomerOrderRow
                key={order.id}
                order={order}
                onLongPress={(selected) => {
                  setContactOrder(selected);
                  setContactOpen(true);
                }}
              />
            ))}
            {historyQuery.hasNextPage ? (
              <Button
                title={
                  historyQuery.isFetchingNextPage
                    ? 'Loading...'
                    : `Load more orders${remaining > 0 ? ` (${formatNumber(remaining)} remaining)` : ''}`
                }
                variant="outline"
                size="sm"
                fullWidth
                loading={historyQuery.isFetchingNextPage}
                onPress={() => void historyQuery.fetchNextPage()}
                accessibilityLabel="Load more orders for this customer"
              />
            ) : null}
          </View>
        )}
      </SectionCard>

      <OrderContactSheet
        order={contactOrder}
        visible={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </View>
  );
}

/** Compact order row: number + total, date, status/payment badges. */
function CustomerOrderRow({
  order,
  onLongPress,
}: {
  order: Order;
  onLongPress: (order: Order) => void;
}) {
  const { theme } = useTheme();

  const label = [
    `Order ${order.orderNumber}`,
    formatCurrency(order.total),
    ORDER_STATUS_LABELS[order.orderStatus],
    PAYMENT_STATUS_LABELS[order.paymentStatus],
    formatDate(order.createdAt),
  ].join(', ');

  return (
    <Pressable
      onPress={() => router.push(`/orders/${order.id}`)}
      onLongPress={() => onLongPress(order)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Long press to view and copy customer contact details"
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.rowTop}>
        <Text variant="bodyMedium" numberOfLines={1} style={styles.rowNumber}>
          {order.orderNumber}
        </Text>
        <Text variant="bodyMedium">{formatCurrency(order.total)}</Text>
      </View>
      <Text variant="caption" tone="muted">
        {formatDate(order.createdAt)}
      </Text>
      <View style={styles.badges}>
        <Badge
          label={ORDER_STATUS_LABELS[order.orderStatus]}
          tone={ORDER_STATUS_TONES[order.orderStatus]}
        />
        <Badge
          label={PAYMENT_STATUS_LABELS[order.paymentStatus]}
          tone={PAYMENT_STATUS_TONES[order.paymentStatus]}
          variant="outline"
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  list: { gap: spacing.sm },
  row: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    minHeight: 44,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowNumber: { flex: 1 },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
