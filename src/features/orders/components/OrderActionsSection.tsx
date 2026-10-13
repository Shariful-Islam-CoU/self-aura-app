import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { ORDER_STATUS_LABELS } from '../labels';
import { CANCELLABLE_ORDER_STATUSES, ORDER_TRANSITIONS, type Order } from '../types';
import { SectionCard } from './SectionCard';

interface OrderActionsSectionProps {
  order: Order;
  /** orders.edit - backend re-checks regardless. */
  canEdit: boolean;
  /** orders.cancel - backend re-checks regardless. */
  canCancel: boolean;
  /** True while a status/cancel mutation is in flight (blocks resubmits). */
  isBusy: boolean;
  onAdvance: () => void;
  onRequestCancel: () => void;
}

/**
 * Every action the backend can currently accept for this order, gated by
 * capability (permissions) + state (transition/cancellable) - the backend
 * remains authoritative and its rejection is surfaced as an error.
 */
export function OrderActionsSection({
  order,
  canEdit,
  canCancel,
  isBusy,
  onAdvance,
  onRequestCancel,
}: OrderActionsSectionProps) {
  const nextStatus = ORDER_TRANSITIONS[order.orderStatus][0];
  const showAdvance = canEdit && Boolean(nextStatus);
  const showCancel = canCancel && CANCELLABLE_ORDER_STATUSES.includes(order.orderStatus);
  const hasAny = showAdvance || showCancel;

  return (
    <SectionCard title="Actions">
      {!hasAny ? (
        <Text variant="bodySmall" tone="muted">
          No further actions are available for this order.
        </Text>
      ) : (
        <View style={styles.buttons}>
          {showAdvance && nextStatus ? (
            <Button
              title={`Mark as ${ORDER_STATUS_LABELS[nextStatus]}`}
              icon="arrow-forward-circle-outline"
              fullWidth
              loading={isBusy}
              onPress={onAdvance}
              accessibilityLabel={`Mark order ${order.orderNumber} as ${ORDER_STATUS_LABELS[nextStatus]}`}
            />
          ) : null}
          {showCancel ? (
            <Button
              title="Cancel order"
              variant="danger"
              icon="close-circle-outline"
              fullWidth
              disabled={isBusy}
              onPress={onRequestCancel}
              accessibilityLabel={`Cancel order ${order.orderNumber}`}
            />
          ) : null}
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: spacing.md },
});
