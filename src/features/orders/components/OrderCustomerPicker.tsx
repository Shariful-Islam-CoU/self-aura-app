import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { BottomSheet, SearchInput, Text } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useTheme } from '@/providers';
import { controlHeights, radius, spacing } from '@/theme';
import type { Customer } from '@/features/customers/types';

import { useOrderCustomerLookup } from '../queries';

export interface OrderCustomerPickerProps {
  /** Selected customer (null before anything is chosen). */
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
  error?: string | null;
  disabled?: boolean;
}

/**
 * Customer field for the create-order form. Server-side search against the
 * existing Customers API (`GET /customers`, active only) inside a bottom
 * sheet - the mobile equivalent of the web form's searchable listbox. The
 * full `Customer` object moves back to the form so it can prefill the
 * shipping address from the default saved address.
 */
export function OrderCustomerPicker({
  value,
  onChange,
  error,
  disabled = false,
}: OrderCustomerPickerProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const customersQuery = useOrderCustomerLookup(debouncedSearch, open);
  const customers = customersQuery.data ?? [];
  const hasError = Boolean(error);

  const handleSelect = (customer: Customer) => {
    onChange(customer);
    setOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange(null);
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
          Customer
        </Text>
        <Text variant="label" tone="danger" accessibilityLabel="required">
          *
        </Text>
      </View>

      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={value ? `Customer ${value.name}` : 'Select customer'}
        accessibilityHint={value ? 'Opens the customer list to change the selection' : undefined}
        style={[
          styles.trigger,
          {
            borderColor: hasError ? theme.colors.danger : theme.colors.border,
            backgroundColor: theme.colors.surface,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <View style={styles.triggerBody}>
          <Text
            variant="body"
            tone={value ? 'default' : 'muted'}
            numberOfLines={1}
            style={styles.triggerText}
          >
            {value ? value.name : 'Search customers by name or phone'}
          </Text>
          {value ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {value.phone}
              {value.email ? ` · ${value.email}` : ''}
            </Text>
          ) : null}
        </View>
        {value && !disabled ? (
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear selected customer"
          >
            <Ionicons name="close-circle" size={18} color={theme.colors.iconMuted} />
          </Pressable>
        ) : null}
        <Ionicons name="chevron-down" size={18} color={theme.colors.iconMuted} />
      </Pressable>

      {error ? (
        <Text variant="bodySmall" tone="danger">
          {error}
        </Text>
      ) : null}

      <BottomSheet visible={open} onClose={closePicker} title="Select customer">
        <View style={styles.searchWrap}>
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search name, phone or email"
            accessibilityLabel="Search customers by name, phone or email"
          />
        </View>

        {customersQuery.isPending ? (
          <LoadingIndicator label="Loading customers..." />
        ) : customersQuery.isError ? (
          <ErrorState
            title="Failed to load customers"
            message={getErrorMessage(customersQuery.error)}
            onRetry={() => void customersQuery.refetch()}
            retryLabel="Retry"
          />
        ) : customers.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No active customers found"
            description={
              debouncedSearch.trim()
                ? 'No active customer matches that search. Try a different term.'
                : 'Add the customer in the Customers module first.'
            }
          />
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            renderItem={({ item }) => {
              const selected = item.id === value?.id;
              return (
                <Pressable
                  onPress={() => handleSelect(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Customer ${item.name}, ${item.phone}`}
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
                      {item.name}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {item.phone}
                      {item.email ? ` · ${item.email}` : ''}
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
  triggerBody: { flex: 1, gap: 2, paddingVertical: spacing.sm },
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
