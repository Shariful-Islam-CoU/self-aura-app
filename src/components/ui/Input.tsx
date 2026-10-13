import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme } from '@/providers/ThemeProvider';
import { controlHeights, radius, spacing } from '@/theme';
import type { IconName } from '@/types';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Visible field label; also becomes the default accessible name. */
  label?: string;
  /** Renders the required indicator and announces "required" to AT. */
  required?: boolean;
  /** Validation message - replaces the helper text and tints the border. */
  error?: string | null;
  /** Support hint shown below the field while there is no error. */
  helperText?: string | null;
  /** Enables the secure-text visibility toggle. */
  secure?: boolean;
  /** Leading Ionicons glyph (e.g. `search` inside `SearchInput`). */
  leadingIcon?: IconName;
  /** Shows a clear (x) button whenever the value is non-empty. */
  clearable?: boolean;
  /** Called in addition to `onChangeText('')` when the clear button is hit. */
  onClear?: () => void;
}

/**
 * The one text field of the app: label, required marker, leading icon,
 * secure toggle, clear button, helper/error text - all themed.
 *
 * Keyboard behavior: callers wrap screens in `Screen keyboardAvoiding` and
 * pick the right `keyboardType`/`returnKeyType`; nothing here fights the
 * keyboard or resizes the layout unexpectedly.
 */
export function Input({
  label,
  required = false,
  error,
  helperText,
  secure = false,
  leadingIcon,
  clearable = false,
  onClear,
  editable,
  multiline = false,
  value,
  onChangeText,
  ...rest
}: InputProps) {
  const { theme } = useTheme();
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  const isDisabled = editable === false;
  const hasError = Boolean(error);

  const borderColor = hasError
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  const textColor = isDisabled ? theme.colors.textDisabled : theme.colors.text;

  const showClear = clearable && !isDisabled && (value?.length ?? 0) > 0;

  const handleClear = () => {
    onClear?.();
    onChangeText?.('');
  };

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

      <View
        style={[
          styles.field,
          {
            backgroundColor: isDisabled ? theme.colors.surfaceMuted : theme.colors.surface,
            borderColor,
            minHeight: multiline ? 96 : controlHeights.lg,
            alignItems: multiline ? 'flex-start' : 'center',
            paddingVertical: multiline ? spacing.sm : 0,
          },
        ]}
      >
        {leadingIcon ? (
          <Ionicons
            name={leadingIcon}
            size={theme.iconSizes.md}
            color={isDisabled ? theme.colors.textDisabled : theme.colors.iconMuted}
            style={styles.leadingIcon}
          />
        ) : null}

        <TextInput
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={secure && hidden}
          editable={!isDisabled}
          multiline={multiline}
          value={value}
          onChangeText={onChangeText}
          // Default the accessible name to the visible label; callers can
          // still override it through props (spread comes after).
          accessibilityLabel={label}
          accessibilityHint={required ? 'Required field' : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            {
              ...theme.typography.textStyles.body,
              color: textColor,
              textAlignVertical: multiline ? 'top' : 'center',
            },
          ]}
          {...rest}
        />

        {showClear ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear text"
            onPress={handleClear}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={theme.colors.iconMuted} />
          </Pressable>
        ) : null}

        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((current) => !current)}
            hitSlop={8}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={theme.iconSizes.md}
              color={theme.colors.iconMuted}
            />
          </Pressable>
        ) : null}
      </View>

      {hasError ? (
        <Text
          variant="caption"
          tone="danger"
          style={styles.message}
          // Announces new field errors on Android as soon as they appear.
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" tone="muted" style={styles.message}>
          {helperText}
        </Text>
      ) : null}
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
  leadingIcon: {
    marginRight: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  message: { marginTop: 2 },
});
