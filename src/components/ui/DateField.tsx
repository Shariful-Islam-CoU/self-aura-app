import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/providers/ThemeProvider';
import { controlHeights, radius, spacing } from '@/theme';
import { formatDate } from '@/utils/format';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Text } from './Text';

export interface DateFieldProps {
  label?: string;
  required?: boolean;
  /** Selected date as `YYYY-MM-DD`, or `''` for "no date". */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  helperText?: string | null;
  disabled?: boolean;
  /** Lower bound (inclusive), `YYYY-MM-DD`. */
  minDate?: string;
  /** Upper bound (inclusive), `YYYY-MM-DD`. */
  maxDate?: string;
  /** Shows a "Clear" action in the sheet (default: false). */
  clearable?: boolean;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Parses `YYYY-MM-DD` into a local-time `Date`, or `null` when invalid. */
function parseIso(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Dependency-free calendar date picker. Renders an `Input`-style trigger that
 * opens a themed bottom sheet with a month grid (plus Today/Clear actions).
 * Values are always exchanged as `YYYY-MM-DD` strings - the same wire format
 * the backend accepts for `expenseDate`/date-range filters - and the calendar
 * is built from local-time dates so a selected day never shifts by timezone.
 */
export function DateField({
  label,
  required = false,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  helperText,
  disabled = false,
  minDate,
  maxDate,
  clearable = false,
}: DateFieldProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => parseIso(value) ?? new Date());

  const selected = parseIso(value);
  const min = minDate ? parseIso(minDate) : null;
  const max = maxDate ? parseIso(maxDate) : null;
  const today = useMemo(() => startOfDay(new Date()), []);

  const hasError = Boolean(error);

  const isOutOfRange = (date: Date): boolean => {
    if (min && date < min) return true;
    if (max && date > max) return true;
    return false;
  };

  const days = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  const openSheet = () => {
    if (disabled) return;
    setViewMonth(selected ?? new Date());
    setOpen(true);
  };

  const selectDate = (date: Date) => {
    onChange(toIso(date));
    setOpen(false);
  };

  const changeMonth = (delta: number) => {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const borderColor = hasError
    ? theme.colors.danger
    : open
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={styles.container}>
      {label ? (
        <View style={styles.labelRow}>
          <Text variant="label" tone="secondary">
            {label}
          </Text>
          {required ? (
            <Text variant="label" tone="danger">
              *
            </Text>
          ) : null}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={selected ? `Selected: ${formatDate(selected)}` : placeholder}
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={openSheet}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: disabled ? theme.colors.surfaceMuted : theme.colors.surface,
            borderColor,
            opacity: pressed && !disabled ? 0.72 : 1,
          },
        ]}
      >
        <Text
          variant="body"
          tone={selected ? 'default' : 'muted'}
          style={styles.triggerText}
          numberOfLines={1}
        >
          {selected ? formatDate(selected) : placeholder}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={theme.iconSizes.md}
          color={theme.colors.iconMuted}
        />
      </Pressable>

      {hasError ? (
        <Text
          variant="caption"
          tone="danger"
          style={styles.message}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" tone="muted" style={styles.message}>
          {helperText}
        </Text>
      ) : null}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label ?? 'Select date'}>
        <View style={styles.sheet}>
          <View style={styles.monthRow}>
            <IconButton
              icon="chevron-back"
              accessibilityLabel="Previous month"
              onPress={() => changeMonth(-1)}
            />
            <Text variant="subtitle">
              {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </Text>
            <IconButton
              icon="chevron-forward"
              accessibilityLabel="Next month"
              onPress={() => changeMonth(1)}
            />
          </View>

          <View style={styles.weekRow}>
            {WEEKDAY_LABELS.map((weekday) => (
              <View key={weekday} style={styles.dayCell}>
                <Text variant="caption" tone="muted">
                  {weekday}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {days.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }
              const iso = toIso(date);
              const isSelected = selected ? toIso(selected) === iso : false;
              const isToday = toIso(today) === iso;
              const outOfRange = isOutOfRange(date);
              return (
                <Pressable
                  key={iso}
                  accessibilityRole="button"
                  accessibilityLabel={formatDate(date)}
                  accessibilityState={{ selected: isSelected, disabled: outOfRange }}
                  disabled={outOfRange}
                  onPress={() => selectDate(date)}
                  style={({ pressed }) => [
                    styles.dayCell,
                    styles.dayPressable,
                    isToday && { borderColor: theme.colors.primary },
                    isSelected && { backgroundColor: theme.colors.primary },
                    pressed &&
                      !outOfRange &&
                      !isSelected && {
                        backgroundColor: theme.colors.surfaceMuted,
                      },
                  ]}
                >
                  <Text
                    variant="bodySmall"
                    tone={outOfRange ? 'muted' : isSelected ? 'default' : 'default'}
                    style={isSelected ? { color: theme.colors.onPrimary } : undefined}
                  >
                    {date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Button
              title="Today"
              variant="outline"
              onPress={() => selectDate(today)}
              disabled={isOutOfRange(today)}
              style={styles.action}
            />
            {clearable ? (
              <Button
                title="Clear"
                variant="ghost"
                onPress={() => {
                  onChange('');
                  setOpen(false);
                }}
                style={styles.action}
              />
            ) : null}
          </View>
        </View>
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
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: controlHeights.lg,
  },
  triggerText: {
    flex: 1,
  },
  message: { marginTop: 2 },
  sheet: { gap: spacing.sm },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPressable: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  action: { flex: 1 },
});
