import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from './BottomSheet';
import { Divider } from './Divider';
import { Text } from './Text';
import { useTheme } from '@/providers/ThemeProvider';
import { controlHeights, radius, spacing } from '@/theme';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  required?: boolean;
  /** Prompt shown when nothing is selected. */
  placeholder?: string;
  value?: string | null;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  error?: string | null;
  helperText?: string | null;
  disabled?: boolean;
}

/**
 * Tap-to-open select rendered as a bottom sheet - the right mobile
 * replacement for a desktop dropdown, and no picker dependency needed.
 * The trigger mirrors `Input`'s visuals so mixed forms stay consistent.
 */
export function Select({
  label,
  required = false,
  placeholder = 'Select an option',
  value,
  options,
  onChange,
  error,
  helperText,
  disabled = false,
}: SelectProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);
  const hasError = Boolean(error);

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
        accessibilityHint={selected ? `Selected: ${selected.label}` : placeholder}
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
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
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
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

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label ?? 'Select'}>
        {options.length === 0 ? (
          <Text variant="body" tone="muted" style={styles.empty}>
            No options available
          </Text>
        ) : (
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <View key={option.value}>
                  {index > 0 ? <Divider /> : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: isSelected, disabled: option.disabled }}
                    disabled={option.disabled}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      { opacity: option.disabled ? 0.5 : pressed ? 0.72 : 1 },
                    ]}
                  >
                    <Text
                      variant={isSelected ? 'bodyMedium' : 'body'}
                      tone={isSelected ? 'primary' : option.disabled ? 'muted' : 'default'}
                      style={styles.optionText}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                    {isSelected ? (
                      <Ionicons
                        name="checkmark"
                        size={theme.iconSizes.md}
                        color={theme.colors.primary}
                      />
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs, marginBottom: spacing.sm },
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
  list: {
    maxHeight: 320,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  optionText: {
    flex: 1,
  },
  empty: {
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
});
