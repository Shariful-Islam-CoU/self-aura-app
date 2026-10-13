import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { BottomSheet, SearchInput, Text } from '@/components/ui';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/features/orders/labels';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useTheme } from '@/providers';
import { controlHeights, radius, spacing } from '@/theme';
import { formatCurrency } from '@/utils/format';

import { usePaymentOrderLookup } from '../queries';

export interface PaymentOrderPickerProps {
  /** Selected order id (empty when nothing is chosen yet). */
  value: string;
  /** Human label for the selected order (order number), if known. */
  selectedLabel?: string;
  onChange: (orderId: string, label: string) => void;
  error?: string | null;
  disabled?: boolean;
}

/**
 * Order field for the payment form. Search runs server-side against the
 * existing Orders module (`GET /orders`) inside a bottom sheet - the mobile
 * equivalent of the web form's order select, with a debounced search box
 * because orders can be numerous. Only the chosen order id + number move back
 * to the form; no order objects are stored.
 */
export function PaymentOrderPicker({
  value,
  selectedLabel,
  onChange,
  error,
  disabled = false,
}: PaymentOrderPickerProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const ordersQuery = usePaymentOrderLookup(debouncedSearch, open);
  const orders = ordersQuery.data ?? [];
  const hasError = Boolean(error);

  const handleSelect = (orderId: string, label: string) => {
    onChange(orderId, label);
    setOpen(false);
    setSearch('');
  };

  const closePicker = () => {
    setOpen(false);
    setSearch('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text variant="label" tone="secondary">
          Order
        </Text>
        <Text variant="label" tone="danger" accessibilityLabel="required">
          *
        </Text>
      </View>

      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={selectedLabel ? `Order ${selectedLabel}` : 'Select order'}
        style={[
          styles.trigger,
          {
            borderColor: hasError ? theme.colors.danger : theme.colors.border,
            backgroundColor: theme.colors.surface,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Text
          variant="body"
          tone={selectedLabel ? 'default' : 'muted'}
          numberOfLines={1}
          style={styles.triggerText}
        >
          {selectedLabel || 'Select the order this payment is for'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.colors.iconMuted} />
      </Pressable>

      {error ? (
        <Text variant="bodySmall" tone="danger">
          {error}
        </Text>
      ) : null}

      <BottomSheet visible={open} onClose={closePicker} title="Select order">
        <View style={styles.searchWrap}>
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search order number"
            accessibilityLabel="Search orders by number"
          />
        </View>

        {ordersQuery.isPending ? (
          <LoadingIndicator label="Loading orders..." />
        ) : ordersQuery.isError ? (
          <ErrorState
            title="Failed to load orders"
            message={getErrorMessage(ordersQuery.error)}
            onRetry={() => void ordersQuery.refetch()}
            retryLabel="Retry"
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            title="No orders found"
            description={
              debouncedSearch.trim()
                ? 'No orders match that number. Try a different search.'
                : 'There are no orders available to record a payment against.'
            }
          />
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            renderItem={({ item }) => {
              const selected = item.id === value;
              return (
                <Pressable
                  onPress={() => handleSelect(item.id, item.orderNumber)}
                  accessibilityRole="button"
                  accessibilityLabel={`Order ${item.orderNumber}, ${item.customer.name ?? 'no customer'}, ${formatCurrency(item.total)}, ${ORDER_STATUS_LABELS[item.orderStatus]}`}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      borderBottomColor: theme.colors.border,
                      backgroundColor: selected ? theme.colors.primarySoft : 'transparent',
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={styles.optionBody}>
                    <Text variant="bodyMedium" numberOfLines={1}>
                      {item.orderNumber}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {item.customer.name ?? 'No customer'} · {formatCurrency(item.total)}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {ORDER_STATUS_LABELS[item.orderStatus]} · Paid:{' '}
                      {PAYMENT_STATUS_LABELS[item.paymentStatus]}
                    </Text>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  ) : null}
                </Pressable>
              );
            }}
          />
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: controlHeights.lg,
  },
  triggerText: { flex: 1 },
  searchWrap: { paddingBottom: spacing.sm },
  list: { maxHeight: 380 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  optionBody: { flex: 1, gap: 2 },
});
