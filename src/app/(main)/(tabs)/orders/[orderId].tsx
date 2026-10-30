import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { getErrorMessage, isApiError } from '@/api';
import { EmptyState, ErrorState } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Dialog, Input, Text } from '@/components/ui';
import {
  OrderActionsSection,
  OrderCustomerSection,
  OrderDeliverySection,
  OrderDetailsSkeleton,
  OrderItemsSection,
  OrderNoteSection,
  OrderPaymentSection,
  OrderPricingSection,
  OrderStatusSection,
  OrderSummarySection,
} from '@/features/orders/components';
import {
  useCancelOrder,
  useOrderDetails,
  useOrderPaymentSummary,
  useOverrideOrderDeliveryCharge,
  useUpdateOrderStatus,
} from '@/features/orders/queries';
import { ORDER_STATUS_LABELS } from '@/features/orders/labels';
import { ORDER_TRANSITIONS } from '@/features/orders/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/providers';
import { spacing } from '@/theme';

/**
 * Order details: fetched by ID only (navigation passes `orderId` - never an
 * order object). Sections render backend data as-is: snapshot item prices,
 * backend-calculated totals, ledger summary, and only the status
 * transitions + cancellation the backend currently accepts. Every action
 * is confirmed, backend-validated and never faked - a rejected request
 * shows the server's own message and reloads the real state.
 */
export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { hasPermission } = usePermissions();
  const toast = useToast();

  const canView = hasPermission('orders.view');
  const canEdit = hasPermission('orders.edit');
  const canCancel = hasPermission('orders.cancel');
  const canOverrideCharge = hasPermission('orders.overrideDeliveryCharge');

  const orderQuery = useOrderDetails(canView ? orderId : undefined);
  const summaryQuery = useOrderPaymentSummary(canView ? orderId : undefined);
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();
  const overrideDeliveryCharge = useOverrideOrderDeliveryCharge();

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideCharge, setOverrideCharge] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const order = orderQuery.data;
  const nextStatus = order ? ORDER_TRANSITIONS[order.orderStatus][0] : undefined;
  const isBusy = updateStatus.isPending || cancelOrder.isPending;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([orderQuery.refetch(), summaryQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAdvance = () => {
    if (!order || !nextStatus || isBusy) return;
    const targetLabel = ORDER_STATUS_LABELS[nextStatus];
    updateStatus.mutate(
      { id: order.id, status: nextStatus },
      {
        onSuccess: () => {
          setStatusDialogOpen(false);
          toast.success(`Order marked as ${targetLabel}.`);
        },
        onError: (error) => {
          // Backend rejected the transition (stale state / permission):
          // show its message and reload the real state - never fake success.
          setStatusDialogOpen(false);
          toast.error(getErrorMessage(error));
          void orderQuery.refetch();
        },
      },
    );
  };

  const handleCancel = () => {
    if (!order || isBusy) return;
    cancelOrder.mutate(
      { id: order.id },
      {
        onSuccess: () => {
          setCancelDialogOpen(false);
          toast.success('Order cancelled successfully.');
        },
        onError: (error) => {
          setCancelDialogOpen(false);
          toast.error(getErrorMessage(error));
          void orderQuery.refetch();
        },
      },
    );
  };

  const handleOpenOverride = () => {
    if (!order) return;
    overrideDeliveryCharge.reset();
    setOverrideError(null);
    setOverrideReason('');
    // Seed the field with the currently billed fee so the manager edits from
    // a real value; the backend recomputes the total from its own numbers.
    setOverrideCharge(
      String(order.delivery?.finalCharge ?? order.delivery?.charge ?? order.deliveryCharge ?? 0),
    );
    setOverrideDialogOpen(true);
  };

  const handleOverride = () => {
    if (!order) return;
    const trimmed = overrideCharge.trim();
    const parsed = Number(trimmed);
    if (!trimmed || !Number.isFinite(parsed) || parsed < 0) {
      setOverrideError('Enter a valid delivery charge (0 or more).');
      return;
    }
    setOverrideError(null);
    overrideDeliveryCharge.mutate(
      { id: order.id, finalCharge: parsed, reason: overrideReason.trim() || undefined },
      {
        onSuccess: () => {
          setOverrideDialogOpen(false);
          toast.success('Delivery charge updated.');
        },
        // Keep the editor open on failure so the server's message can be
        // corrected and the request retried - never fake success.
        onError: (error) => {
          setOverrideError(getErrorMessage(error));
        },
      },
    );
  };

  const header = (
    <AppHeader
      variant="feature"
      title="Order details"
      onBack={() => router.replace('/orders')}
    />
  );

  if (!orderId) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="receipt-outline"
          title="Order not found"
          description="Open an order from the list to see its details."
          actionLabel="Back to orders"
          onAction={() => router.replace('/orders')}
        />
      </Screen>
    );
  }

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view this order." />
      </Screen>
    );
  }

  if (orderQuery.isPending) {
    return (
      <Screen>
        {header}
        <OrderDetailsSkeleton />
      </Screen>
    );
  }

  if (!order) {
    const error = orderQuery.error;
    if (isApiError(error) && error.kind === 'authorization') {
      return (
        <Screen>
          {header}
          <ErrorState
            title="Access denied"
            message="You don't have permission to view this order."
          />
        </Screen>
      );
    }
    if (isApiError(error) && error.kind === 'notFound') {
      return (
        <Screen>
          {header}
          <EmptyState
            icon="receipt-outline"
            title="Order not found"
            description="This order may have been removed."
            actionLabel="Back to orders"
            onAction={() => router.replace('/orders')}
          />
        </Screen>
      );
    }
    return (
      <Screen>
        {header}
        <ErrorState
          title="Failed to load order"
          message={getErrorMessage(error)}
          onRetry={() => void orderQuery.refetch()}
          retryLabel="Retry"
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      refreshControl={{
        refreshing,
        onRefresh: () => void handleRefresh(),
      }}
    >
      {header}
      <View style={styles.container}>
        <OrderSummarySection order={order} />
        <OrderStatusSection order={order} />
        <OrderCustomerSection order={order} onCallFailed={(message) => toast.error(message)} />
        <OrderItemsSection order={order} />
        <OrderPricingSection order={order} />
        <OrderPaymentSection
          order={order}
          summary={summaryQuery.data}
          summaryLoading={summaryQuery.isPending}
        />
        <OrderDeliverySection
          order={order}
          canOverrideCharge={canOverrideCharge}
          onRequestOverride={handleOpenOverride}
        />
        {order.note ? <OrderNoteSection note={order.note} /> : null}
        <OrderActionsSection
          order={order}
          canEdit={canEdit}
          canCancel={canCancel}
          isBusy={isBusy}
          onAdvance={() => {
            updateStatus.reset();
            setStatusDialogOpen(true);
          }}
          onRequestCancel={() => {
            cancelOrder.reset();
            setCancelDialogOpen(true);
          }}
        />
      </View>

      <Dialog
        visible={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        title={nextStatus ? `Mark as ${ORDER_STATUS_LABELS[nextStatus]}?` : 'Order status'}
        message={
          nextStatus
            ? `Order ${order.orderNumber} will move from ${ORDER_STATUS_LABELS[order.orderStatus]} to ${ORDER_STATUS_LABELS[nextStatus]}. The server validates every status change.`
            : undefined
        }
        primaryAction={{
          label: nextStatus ? `Mark as ${ORDER_STATUS_LABELS[nextStatus]}` : 'Confirm',
          loading: updateStatus.isPending,
          onPress: handleAdvance,
        }}
        secondaryAction={{ label: 'Not now' }}
      />

      <Dialog
        visible={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="Cancel this order?"
        message={`Order ${order.orderNumber} will be cancelled and its stock restored by the server. This cannot be undone.`}
        primaryAction={{
          label: 'Cancel order',
          variant: 'danger',
          loading: cancelOrder.isPending,
          onPress: handleCancel,
        }}
        secondaryAction={{ label: 'Keep order' }}
      />

      <Dialog
        visible={overrideDialogOpen}
        onClose={() => {
          if (overrideDeliveryCharge.isPending) return;
          setOverrideDialogOpen(false);
        }}
        dismissOnBackdrop={!overrideDeliveryCharge.isPending}
        title="Override delivery charge"
        primaryAction={{
          label: 'Save override',
          loading: overrideDeliveryCharge.isPending,
          onPress: handleOverride,
        }}
        secondaryAction={{ label: 'Cancel' }}
      >
        <View style={styles.overrideFields}>
          <Text variant="bodySmall" tone="secondary">
            Changes the billed delivery fee and recomputes the order total on the server. The
            rule-based charge is kept for reference and the change is audited.
          </Text>
          <Input
            label="Final delivery charge"
            value={overrideCharge}
            onChangeText={setOverrideCharge}
            keyboardType="decimal-pad"
            editable={!overrideDeliveryCharge.isPending}
            error={overrideError}
          />
          <Input
            label="Reason (optional)"
            value={overrideReason}
            onChangeText={setOverrideReason}
            editable={!overrideDeliveryCharge.isPending}
            maxLength={500}
            multiline
            helperText="Recorded in the override trail and the audit log."
          />
        </View>
      </Dialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  overrideFields: { gap: spacing.md },
});
