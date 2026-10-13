import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getErrorMessage } from '@/api';
import { Button, Input, SearchInput, Select, Text, type SelectOption } from '@/components/ui';
import { SectionCard } from '@/features/customers/components/SectionCard';
import { courierService } from '@/features/couriers/services/courierService';
import type { Courier } from '@/features/couriers/types';
import { orderService } from '@/features/orders/services/orderService';
import type { Order } from '@/features/orders/types';
import { ORDER_STATUS_LABELS } from '@/features/orders/labels';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePermissions } from '@/hooks/usePermissions';
import { spacing } from '@/theme';
import { formatCurrency } from '@/utils/format';
import { SHIPPABLE_ORDER_STATUSES } from '../types';
import type { CreateShipmentData, Shipment, UpdateShipmentData } from '../types';

export interface ShipmentFormProps {
  mode: 'create' | 'edit';
  shipment?: Shipment | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateShipmentData | UpdateShipmentData) => Promise<void>;
  onCancel: () => void;
}

interface ShipmentFormErrors {
  order?: string;
  courier?: string;
  trackingNumber?: string;
  deliveryCharge?: string;
  note?: string;
}

/**
 * Create/edit shipment form. Validation mirrors the backend schemas
 * (createShipmentSchema / updateShipmentSchema) and relation pickers load
 * real API data - never hardcoded:
 *
 * - Order (create only): debounced search over the backend-defined shippable
 *   order statuses, one list call per status merged and de-duplicated. The
 *   server re-validates eligibility on submit. Not editable on update
 *   (backend rule) - the linked order renders read-only instead.
 * - Courier: the real active-courier list response. Inactive couriers are
 *   rejected by the backend, so only active ones are offered (plus the
 *   currently linked one on edit, so the form never opens blank).
 * - Tracking number is user-provided only - nothing is ever generated.
 * - Delivery charge is optional on create (the server falls back to the
 *   order's charge); on edit only changed fields are sent.
 */
export function ShipmentForm({
  mode,
  shipment,
  isSubmitting,
  onSubmit,
  onCancel,
}: ShipmentFormProps) {
  const { hasPermission } = usePermissions();
  const canViewOrders = hasPermission('orders.view');

  const [courierId, setCourierId] = useState(
    mode === 'edit' && shipment ? shipment.courier.id : '',
  );
  const [trackingNumber, setTrackingNumber] = useState(
    mode === 'edit' && shipment ? (shipment.trackingNumber ?? '') : '',
  );
  const [deliveryCharge, setDeliveryCharge] = useState(
    mode === 'edit' && shipment ? String(shipment.deliveryCharge) : '',
  );
  const [note, setNote] = useState(mode === 'edit' && shipment ? (shipment.note ?? '') : '');

  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [couriersLoading, setCouriersLoading] = useState(true);
  const [couriersError, setCouriersError] = useState<string | null>(null);

  const [orderSearch, setOrderSearch] = useState('');
  const debouncedOrderSearch = useDebouncedValue(orderSearch, 350);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');

  const [errors, setErrors] = useState<ShipmentFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Active couriers only - inactive couriers are rejected by the backend.
  useEffect(() => {
    let cancelled = false;
    setCouriersLoading(true);
    courierService
      .list({ limit: 100, isActive: true, sortBy: 'name', sortOrder: 'asc' })
      .then((data) => {
        if (cancelled) return;
        const list = data.couriers;
        // Edit mode: keep the currently linked courier selectable even if it
        // has since been deactivated, so the form never opens blank.
        if (
          mode === 'edit' &&
          shipment?.courier.id &&
          !list.some((c) => c.id === shipment.courier.id)
        ) {
          list.unshift({
            id: shipment.courier.id,
            name: `${shipment.courier.name ?? 'Courier'} (inactive)`,
            isActive: false,
            createdAt: '',
            updatedAt: '',
          });
        }
        setCouriers(list);
        setCouriersLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setCouriersError(getErrorMessage(error));
        setCouriersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, shipment]);

  // Eligible order picker (create only): shippable statuses only, merged and
  // de-duplicated. The server re-validates eligibility on submit.
  useEffect(() => {
    if (mode !== 'create' || !canViewOrders) return;
    let cancelled = false;
    setOrdersLoading(true);
    Promise.all(
      SHIPPABLE_ORDER_STATUSES.map((status) =>
        orderService.list({
          page: 1,
          limit: 50,
          search: debouncedOrderSearch.trim() || undefined,
          status,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
      ),
    )
      .then((results) => {
        if (cancelled) return;
        const seen = new Set<string>();
        const merged: Order[] = [];
        for (const result of results) {
          for (const order of result.orders) {
            if (!seen.has(order.id)) {
              seen.add(order.id);
              merged.push(order);
            }
          }
        }
        merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setOrders(merged);
        setOrdersError(null);
        setOrdersLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setOrdersError(getErrorMessage(error));
        setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, debouncedOrderSearch, canViewOrders]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const courierOptions: SelectOption[] = useMemo(
    () => couriers.map((courier) => ({ value: courier.id, label: courier.name })),
    [couriers],
  );

  const orderOptions: SelectOption[] = useMemo(
    () =>
      orders.map((order) => ({
        value: order.id,
        label: `${order.orderNumber} — ${order.customer.name ?? 'Customer'} · ${formatCurrency(order.total)}`,
      })),
    [orders],
  );

  const handleSelectOrder = (value: string) => {
    setSelectedOrderId(value);
    setErrors((prev) => ({ ...prev, order: undefined }));
    const order = orders.find((o) => o.id === value);
    // Backend uses the order's delivery charge when none is provided; prefill
    // it as a hint (the submitted value is still validated by the server).
    if (order) setDeliveryCharge(String(order.deliveryCharge));
  };

  const validate = (): ShipmentFormErrors => {
    const next: ShipmentFormErrors = {};
    if (mode === 'create' && !selectedOrderId) {
      next.order = 'Select an order to ship.';
    }
    if (!courierId) {
      next.courier = 'Select a courier.';
    }
    const chargeText = deliveryCharge.trim();
    if (chargeText) {
      const parsed = Number(chargeText);
      if (!Number.isFinite(parsed)) {
        next.deliveryCharge = 'Must be a number.';
      } else if (parsed < 0) {
        next.deliveryCharge = 'Must be at least 0.';
      } else if (parsed > 99999999) {
        next.deliveryCharge = 'Must be at most 99999999.';
      }
    }
    if (trackingNumber.trim().length > 100) {
      next.trackingNumber = 'Must be at most 100 characters.';
    }
    if (note.trim().length > 2000) {
      next.note = 'Must be at most 2000 characters.';
    }
    return next;
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const chargeText = deliveryCharge.trim();
    const tracking = trackingNumber.trim();
    const noteText = note.trim();

    let payload: CreateShipmentData | UpdateShipmentData;
    if (mode === 'create') {
      payload = {
        order: selectedOrderId,
        courier: courierId,
        trackingNumber: tracking || undefined,
        deliveryCharge: chargeText ? Number(chargeText) : undefined,
        note: noteText || undefined,
      };
    } else {
      // Update schema requires at least one field - send only what changed.
      const initial = {
        courier: shipment?.courier.id ?? '',
        trackingNumber: shipment?.trackingNumber ?? '',
        deliveryCharge: shipment ? String(shipment.deliveryCharge) : '',
        note: shipment?.note ?? '',
      };
      payload = {};
      if (courierId !== initial.courier) payload.courier = courierId;
      if (tracking !== initial.trackingNumber) payload.trackingNumber = tracking || undefined;
      if (chargeText !== initial.deliveryCharge) {
        payload.deliveryCharge = chargeText ? Number(chargeText) : undefined;
      }
      if (noteText !== initial.note) payload.note = noteText || undefined;
      if (Object.keys(payload).length === 0) {
        setSubmitError('No changes to save.');
        return;
      }
    }

    setSubmitError(null);
    try {
      await onSubmit(payload);
    } catch (error) {
      // Backend stays authoritative (duplicate shipment, inactive courier,
      // order no longer shippable) - surface its message, never fake success.
      setSubmitError(getErrorMessage(error));
    }
  };

  return (
    <View style={styles.container}>
      {submitError ? (
        <Text variant="bodySmall" tone="danger" accessibilityRole="alert">
          {submitError}
        </Text>
      ) : null}

      {mode === 'create' ? (
        <SectionCard title="Order">
          {canViewOrders ? (
            <>
              <SearchInput
                value={orderSearch}
                onValueChange={setOrderSearch}
                placeholder="Search by order number"
                accessibilityLabel="Search shippable orders"
                editable={!isSubmitting}
              />
              <Text variant="caption" tone="muted">
                Only orders in shippable statuses are offered. The server re-validates on save.
              </Text>
              {ordersError ? (
                <Text variant="bodySmall" tone="danger">
                  {ordersError}
                </Text>
              ) : null}
              <Select
                label="Order"
                required
                placeholder={ordersLoading ? 'Loading orders...' : 'Select order'}
                value={selectedOrderId || null}
                options={orderOptions}
                onChange={handleSelectOrder}
                error={errors.order}
                disabled={isSubmitting || ordersLoading}
              />
              {selectedOrder ? (
                <View style={styles.selectedBox}>
                  <Text variant="bodyMedium">{selectedOrder.orderNumber}</Text>
                  <Text variant="caption" tone="muted">
                    {selectedOrder.customer.name ?? 'Customer'} ·{' '}
                    {formatCurrency(selectedOrder.total)} ·{' '}
                    {ORDER_STATUS_LABELS[selectedOrder.orderStatus]}
                  </Text>
                  <Text variant="caption" tone="muted">
                    The order&apos;s shipping address is copied by the server and cannot be changed
                    here.
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <Text variant="bodySmall" tone="muted">
              You need orders viewing permission to pick an order.
            </Text>
          )}
        </SectionCard>
      ) : (
        <SectionCard title="Order">
          <Text variant="bodyMedium">{shipment?.shipmentNumber}</Text>
          <Text variant="caption" tone="muted">
            Order {shipment?.order.orderNumber ?? shipment?.order.id} ·{' '}
            {shipment?.customer.name ?? 'Customer'}
          </Text>
          <Text variant="caption" tone="muted">
            The linked order cannot be changed on an existing shipment (backend rule).
          </Text>
        </SectionCard>
      )}

      <SectionCard title="Delivery">
        {couriersError ? (
          <Text variant="bodySmall" tone="danger">
            {couriersError}
          </Text>
        ) : null}
        <Select
          label="Courier"
          required
          placeholder={couriersLoading ? 'Loading couriers...' : 'Select courier'}
          value={courierId || null}
          options={courierOptions}
          onChange={(value) => {
            setCourierId(value);
            setErrors((prev) => ({ ...prev, courier: undefined }));
          }}
          error={errors.courier}
          disabled={isSubmitting || couriersLoading}
        />
        <Input
          label="Tracking number"
          maxLength={100}
          value={trackingNumber}
          onChangeText={(text) => {
            setTrackingNumber(text);
            setErrors((prev) => ({ ...prev, trackingNumber: undefined }));
          }}
          error={errors.trackingNumber}
          placeholder="Optional, entered manually"
          editable={!isSubmitting}
          helperText="Tracking numbers are never generated - the server stores exactly what you enter."
        />
        <Input
          label="Delivery charge"
          value={deliveryCharge}
          onChangeText={(text) => {
            setDeliveryCharge(text);
            setErrors((prev) => ({ ...prev, deliveryCharge: undefined }));
          }}
          error={errors.deliveryCharge}
          placeholder="৳"
          keyboardType="decimal-pad"
          editable={!isSubmitting}
          helperText="Leave empty on create to use the order's delivery charge (the server decides)."
        />
        <Input
          label="Note"
          value={note}
          onChangeText={setNote}
          error={errors.note}
          placeholder="Optional internal note"
          multiline
          numberOfLines={4}
          editable={!isSubmitting}
        />
      </SectionCard>

      <View style={styles.actions}>
        <Button title="Cancel" variant="outline" onPress={onCancel} style={styles.action} />
        <Button
          title={mode === 'create' ? 'Create shipment' : 'Save changes'}
          onPress={() => void handleSubmit()}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  selectedBox: { gap: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
});
