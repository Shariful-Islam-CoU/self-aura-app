import { Keyboard, ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet, Button, Chip, Input, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '../labels';
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from '../types';

/** Filter-only state (sort lives in the list toolbar). */
export interface OrderFilterValues {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  from?: string;
  to?: string;
}

interface OrderFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Working copy owned by the screen (reset every time the sheet opens). */
  value: OrderFilterValues;
  onValueChange: (next: OrderFilterValues) => void;
  /** Commits the draft; the screen closes the sheet. */
  onApply: (filters: OrderFilterValues) => void;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Fully derived - no validation state, so nothing can go stale on reopen. */
function dateErrorOf(from: string, to: string): string | null {
  if (from && !DATE_PATTERN.test(from)) return 'From date must be YYYY-MM-DD.';
  if (to && !DATE_PATTERN.test(to)) return 'To date must be YYYY-MM-DD.';
  if (from && to && from > to) return 'From date must be before the to date.';
  return null;
}

function ChipGroup({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: readonly { value: string; label: string }[];
  selected: string | undefined;
  onSelect: (value: string | undefined) => void;
}) {
  return (
    <View style={styles.group}>
      <Text variant="label" tone="secondary">
        {title}
      </Text>
      <View style={styles.chips}>
        <Chip label="All" selected={selected === undefined} onPress={() => onSelect(undefined)} />
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={selected === option.value}
            // Tapping the active chip clears it (back to "All").
            onPress={() => onSelect(selected === option.value ? undefined : option.value)}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * Mobile filter panel (bottom sheet, never a desktop form): order status,
 * payment status and payment method as chip groups plus a from/to date
 * range - only filters the backend's `GET /orders` actually supports. The
 * draft is controlled by the list screen, which resets it on open, so the
 * sheet never holds stale state; date validation is derived on render and
 * Apply is blocked while invalid. Sort is not here - it applies instantly
 * from the toolbar.
 */
export function OrderFiltersSheet({
  visible,
  onClose,
  value,
  onValueChange,
  onApply,
}: OrderFiltersSheetProps) {
  const from = value.from ?? '';
  const to = value.to ?? '';
  const dateError = dateErrorOf(from, to);

  const handleApply = () => {
    if (dateError) return;
    Keyboard.dismiss();
    onApply(value);
  };

  const handleReset = () => {
    onValueChange({});
  };

  const handleDateChange = (key: 'from' | 'to', text: string) => {
    const trimmed = text.trim();
    onValueChange({
      ...value,
      from: key === 'from' ? trimmed || undefined : value.from,
      to: key === 'to' ? trimmed || undefined : value.to,
    });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Filters">
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ChipGroup
          title="Order status"
          options={ORDER_STATUSES.map((status) => ({
            value: status,
            label: ORDER_STATUS_LABELS[status],
          }))}
          selected={value.status}
          onSelect={(next) => onValueChange({ ...value, status: next as OrderStatus })}
        />

        <ChipGroup
          title="Payment status"
          options={PAYMENT_STATUSES.map((status) => ({
            value: status,
            label: PAYMENT_STATUS_LABELS[status],
          }))}
          selected={value.paymentStatus}
          onSelect={(next) => onValueChange({ ...value, paymentStatus: next as PaymentStatus })}
        />

        <ChipGroup
          title="Payment method"
          options={PAYMENT_METHODS.map((method) => ({
            value: method,
            label: PAYMENT_METHOD_LABELS[method],
          }))}
          selected={value.paymentMethod}
          onSelect={(next) => onValueChange({ ...value, paymentMethod: next as PaymentMethod })}
        />

        <View style={styles.group}>
          <Text variant="label" tone="secondary">
            Date range (order date)
          </Text>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Input
                label="From"
                placeholder="YYYY-MM-DD"
                value={from}
                onChangeText={(text) => handleDateChange('from', text)}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                maxLength={10}
              />
            </View>
            <View style={styles.dateField}>
              <Input
                label="To"
                placeholder="YYYY-MM-DD"
                value={to}
                onChangeText={(text) => handleDateChange('to', text)}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                maxLength={10}
              />
            </View>
          </View>
          {dateError ? (
            <Text variant="caption" tone="danger">
              {dateError}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Button title="Reset" variant="outline" onPress={handleReset} style={styles.action} />
          <Button
            title="Apply"
            onPress={handleApply}
            disabled={Boolean(dateError)}
            style={styles.action}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.lg },
  group: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dateRow: { flexDirection: 'row', gap: spacing.md },
  dateField: { flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
});
