import { ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet, Button, DateField, Select, Text } from '@/components/ui';
import { spacing } from '@/theme';

import {
  PAYMENT_METHOD_FILTER_OPTIONS,
  PAYMENT_STATUS_FILTER_OPTIONS,
  PAYMENT_TYPE_FILTER_OPTIONS,
} from '../labels';
import type { PaymentMethod, PaymentStatus, PaymentType } from '../types';

/**
 * Working filter values for the payment list. Empty string means "no filter";
 * the screen owns the committed copy and resets this draft every open so
 * nothing can go stale.
 */
export interface PaymentFilterValues {
  paymentMethod: PaymentMethod | '';
  paymentStatus: PaymentStatus | '';
  paymentType: PaymentType | '';
  fromDate: string;
  toDate: string;
}

export const EMPTY_PAYMENT_FILTERS: PaymentFilterValues = {
  paymentMethod: '',
  paymentStatus: '',
  paymentType: '',
  fromDate: '',
  toDate: '',
};

interface PaymentFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Working copy owned by the screen. */
  value: PaymentFilterValues;
  onValueChange: (next: PaymentFilterValues) => void;
  /** Commits the draft; the screen closes the sheet. */
  onApply: (filters: PaymentFilterValues) => void;
}

/** Derived, so no validation state can go stale on reopen. */
function rangeError(value: PaymentFilterValues): string | null {
  if (value.fromDate && value.toDate && value.fromDate > value.toDate) {
    return 'The from date must be before the to date.';
  }
  return null;
}

/**
 * Filter sheet for the payment list: method, status, type and a payment-date
 * range. Values are sent straight to the backend
 * (`paymentMethod`/`paymentStatus`/`paymentType`/`fromDate`/`toDate`), never
 * filtered on device.
 */
export function PaymentFiltersSheet({
  visible,
  onClose,
  value,
  onValueChange,
  onApply,
}: PaymentFiltersSheetProps) {
  const error = rangeError(value);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Filter payments">
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Select
          label="Payment method"
          value={value.paymentMethod}
          options={PAYMENT_METHOD_FILTER_OPTIONS}
          onChange={(paymentMethod) =>
            onValueChange({ ...value, paymentMethod: paymentMethod as PaymentMethod | '' })
          }
          placeholder="All methods"
        />

        <Select
          label="Status"
          value={value.paymentStatus}
          options={PAYMENT_STATUS_FILTER_OPTIONS}
          onChange={(paymentStatus) =>
            onValueChange({ ...value, paymentStatus: paymentStatus as PaymentStatus | '' })
          }
          placeholder="All statuses"
        />

        <Select
          label="Type"
          value={value.paymentType}
          options={PAYMENT_TYPE_FILTER_OPTIONS}
          onChange={(paymentType) =>
            onValueChange({ ...value, paymentType: paymentType as PaymentType | '' })
          }
          placeholder="All types"
        />

        <View style={styles.rangeRow}>
          <View style={styles.rangeField}>
            <DateField
              label="From date"
              value={value.fromDate}
              onChange={(fromDate) => onValueChange({ ...value, fromDate })}
              placeholder="Any"
              clearable
            />
          </View>
          <View style={styles.rangeField}>
            <DateField
              label="To date"
              value={value.toDate}
              onChange={(toDate) => onValueChange({ ...value, toDate })}
              placeholder="Any"
              clearable
            />
          </View>
        </View>

        {error ? (
          <Text variant="bodySmall" tone="danger" accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Button
            title="Reset"
            variant="outline"
            onPress={() => onApply(EMPTY_PAYMENT_FILTERS)}
            style={styles.action}
          />
          <Button
            title="Apply filters"
            onPress={() => onApply(value)}
            disabled={Boolean(error)}
            style={styles.action}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.sm },
  rangeRow: { flexDirection: 'row', gap: spacing.md },
  rangeField: { flex: 1 },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  action: { flex: 1 },
});
