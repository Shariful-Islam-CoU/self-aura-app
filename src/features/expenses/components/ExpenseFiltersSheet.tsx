import { ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet, Button, DateField, Select, Text } from '@/components/ui';
import { spacing } from '@/theme';

import { EXPENSE_PAYMENT_METHOD_FILTER_OPTIONS } from '../labels';
import type { ExpensePaymentMethod } from '../types';

/**
 * Working filter values for the expense list. Empty string means "no filter";
 * the screen owns the committed copy and resets this draft every open so
 * nothing can go stale.
 */
export interface ExpenseFilterValues {
  category: string;
  paymentMethod: ExpensePaymentMethod | '';
  fromDate: string;
  toDate: string;
}

export const EMPTY_EXPENSE_FILTERS: ExpenseFilterValues = {
  category: '',
  paymentMethod: '',
  fromDate: '',
  toDate: '',
};

interface ExpenseFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Working copy owned by the screen. */
  value: ExpenseFilterValues;
  onValueChange: (next: ExpenseFilterValues) => void;
  /** Commits the draft; the screen closes the sheet. */
  onApply: (filters: ExpenseFilterValues) => void;
  /** Category options with an "All categories" entry first. */
  categoryOptions: readonly { value: string; label: string }[];
  categoriesLoading?: boolean;
}

/** Derived, so no validation state can go stale on reopen. */
function rangeError(value: ExpenseFilterValues): string | null {
  if (value.fromDate && value.toDate && value.fromDate > value.toDate) {
    return 'The from date must be before the to date.';
  }
  return null;
}

/**
 * Filter sheet for the expense list: category, payment method and an
 * expiry-date range. Values are sent straight to the backend
 * (`category`/`paymentMethod`/`fromDate`/`toDate`), never filtered on device.
 */
export function ExpenseFiltersSheet({
  visible,
  onClose,
  value,
  onValueChange,
  onApply,
  categoryOptions,
  categoriesLoading = false,
}: ExpenseFiltersSheetProps) {
  const error = rangeError(value);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Filter expenses">
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Select
          label="Category"
          value={value.category}
          options={categoryOptions}
          onChange={(category) => onValueChange({ ...value, category })}
          placeholder={categoriesLoading ? 'Loading categories...' : 'All categories'}
          disabled={categoriesLoading}
        />

        <Select
          label="Payment method"
          value={value.paymentMethod}
          options={EXPENSE_PAYMENT_METHOD_FILTER_OPTIONS}
          onChange={(paymentMethod) =>
            onValueChange({ ...value, paymentMethod: paymentMethod as ExpensePaymentMethod | '' })
          }
          placeholder="All methods"
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
            onPress={() => onApply(EMPTY_EXPENSE_FILTERS)}
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
