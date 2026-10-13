import { Keyboard, ScrollView, StyleSheet, View } from 'react-native';

import { BottomSheet, Button, Chip, Input, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { SHIPMENT_STATUS_LABELS } from '../labels';
import { SHIPMENT_STATUSES, type ShipmentStatus } from '../types';

/** Filter-only state (sort lives in the list toolbar). */
export interface ShipmentFilterValues {
  status?: ShipmentStatus;
  fromDate?: string;
  toDate?: string;
}

interface ShipmentFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Working copy owned by the screen (reset every time the sheet opens). */
  value: ShipmentFilterValues;
  onValueChange: (next: ShipmentFilterValues) => void;
  /** Commits the draft; the screen closes the sheet. */
  onApply: (filters: ShipmentFilterValues) => void;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Fully derived - no validation state, so nothing can go stale on reopen. */
function dateErrorOf(fromDate: string, toDate: string): string | null {
  if (fromDate && !DATE_PATTERN.test(fromDate)) return 'From date must be YYYY-MM-DD.';
  if (toDate && !DATE_PATTERN.test(toDate)) return 'To date must be YYYY-MM-DD.';
  if (fromDate && toDate && fromDate > toDate) return 'From date must be before the to date.';
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
 * Mobile filter panel (bottom sheet, never a desktop form): shipment status
 * as a chip group plus a from/to creation-date range - only filters the
 * backend's `GET /shipments` actually supports. The draft is controlled by
 * the list screen, which resets it on open, so the sheet never holds stale
 * state; date validation is derived on render and Apply is blocked while
 * invalid. Sort is not here - it applies instantly from the toolbar.
 */
export function ShipmentFiltersSheet({
  visible,
  onClose,
  value,
  onValueChange,
  onApply,
}: ShipmentFiltersSheetProps) {
  const fromDate = value.fromDate ?? '';
  const toDate = value.toDate ?? '';
  const dateError = dateErrorOf(fromDate, toDate);

  const handleApply = () => {
    if (dateError) return;
    Keyboard.dismiss();
    onApply(value);
  };

  const handleReset = () => {
    onValueChange({});
  };

  const handleDateChange = (key: 'fromDate' | 'toDate', text: string) => {
    const trimmed = text.trim();
    onValueChange({
      ...value,
      fromDate: key === 'fromDate' ? trimmed || undefined : value.fromDate,
      toDate: key === 'toDate' ? trimmed || undefined : value.toDate,
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
          title="Shipment status"
          options={SHIPMENT_STATUSES.map((status) => ({
            value: status,
            label: SHIPMENT_STATUS_LABELS[status],
          }))}
          selected={value.status}
          onSelect={(next) => onValueChange({ ...value, status: next as ShipmentStatus })}
        />

        <View style={styles.group}>
          <Text variant="label" tone="secondary">
            Date range (shipment date)
          </Text>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Input
                label="From"
                placeholder="YYYY-MM-DD"
                value={fromDate}
                onChangeText={(text) => handleDateChange('fromDate', text)}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                maxLength={10}
              />
            </View>
            <View style={styles.dateField}>
              <Input
                label="To"
                placeholder="YYYY-MM-DD"
                value={toDate}
                onChangeText={(text) => handleDateChange('toDate', text)}
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
