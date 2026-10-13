import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { SectionCard } from '@/features/customers/components/SectionCard';
import { spacing } from '@/theme';
import {
  CANCELLABLE_SHIPMENT_STATUSES,
  EDITABLE_SHIPMENT_STATUSES,
  SHIPMENT_STATUS_TRANSITIONS,
} from '../types';
import { SHIPMENT_STATUS_LABELS } from '../labels';
import type { Shipment, ShipmentStatus } from '../types';

interface ShipmentActionsSectionProps {
  shipment: Shipment;
  canEdit: boolean;
  canCancel: boolean;
  isBusy: boolean;
  onAdvance: (next: ShipmentStatus) => void;
  onRequestCancel: () => void;
  onRequestEdit: () => void;
}

/**
 * Only the status changes the backend currently accepts: every next status
 * from `SHIPMENT_STATUS_TRANSITIONS` gets its own button (shipments branch -
 * e.g. shipped can go in transit or fail delivery), plus cancellation while
 * the backend still allows it. Gating is capability + state; the backend
 * re-validates (400 invalid transition / 409 uncancellable).
 */
export function ShipmentActionsSection({
  shipment,
  canEdit,
  canCancel,
  isBusy,
  onAdvance,
  onRequestCancel,
  onRequestEdit,
}: ShipmentActionsSectionProps) {
  const nextStatuses = SHIPMENT_STATUS_TRANSITIONS[shipment.status];
  const showAdvance = canEdit && nextStatuses.length > 0;
  const showCancel = canCancel && CANCELLABLE_SHIPMENT_STATUSES.includes(shipment.status);
  const showEdit = canEdit && EDITABLE_SHIPMENT_STATUSES.includes(shipment.status);

  if (!showAdvance && !showCancel && !showEdit) {
    return (
      <SectionCard title="Actions">
        <Text variant="bodySmall" tone="muted">
          No further actions are available for this shipment.
        </Text>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Actions">
      <View style={styles.actions}>
        {showAdvance
          ? nextStatuses.map((next) => (
              <Button
                key={next}
                title={`Mark as ${SHIPMENT_STATUS_LABELS[next]}`}
                icon={
                  next === 'delivery_failed'
                    ? 'alert-circle-outline'
                    : 'arrow-forward-circle-outline'
                }
                variant={next === 'delivery_failed' ? 'outline' : 'primary'}
                fullWidth
                loading={isBusy}
                disabled={isBusy}
                onPress={() => onAdvance(next)}
              />
            ))
          : null}
        {showEdit ? (
          <Button
            title="Edit shipment"
            icon="create-outline"
            variant="outline"
            fullWidth
            disabled={isBusy}
            onPress={onRequestEdit}
          />
        ) : null}
        {showCancel ? (
          <Button
            title="Cancel shipment"
            icon="close-circle-outline"
            variant="danger"
            fullWidth
            disabled={isBusy}
            onPress={onRequestCancel}
          />
        ) : null}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
});
