import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/ui';
import { spacing } from '@/theme';
import type { DateRangePreset } from '../types';

/** Mobile-friendly compact period picker (chips, not a dropdown). */
export const PERIOD_OPTIONS: readonly { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'last7days', label: '7 days' },
  { value: 'thisMonth', label: 'Month' },
];

export function PeriodSelector({
  value,
  onChange,
  disabled,
}: {
  value: DateRangePreset;
  onChange: (preset: DateRangePreset) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      {PERIOD_OPTIONS.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
          disabled={disabled}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
