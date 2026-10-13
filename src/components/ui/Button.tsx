import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { PRESSED_OPACITY } from './pressable';
import { useTheme } from '@/providers/ThemeProvider';
import { MIN_TOUCH_TARGET, controlHeights, radius, spacing } from '@/theme';
import type { IconName } from '@/types';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and blocks presses - prevents double submissions. */
  loading?: boolean;
  /** Ionicons name for a leading icon. */
  icon?: IconName;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const heights = controlHeights;

// The `sm` height sits below the 44pt minimum touch target, so the hit area
// is extended invisibly to cover the deficit (md/lg already meet it).
const hitSlopValue = Math.max(0, Math.ceil((MIN_TOUCH_TARGET - heights.sm) / 2));

/**
 * The one button of the app. Variants cover every emphasis level; `loading`
 * both shows progress and disables the control, so a slow tap cannot submit
 * twice. Colors and heights come from theme tokens only.
 */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const palette = {
    primary: {
      background: theme.colors.primary,
      pressed: theme.colors.primaryPressed,
      border: 'transparent',
      text: theme.colors.onPrimary,
    },
    secondary: {
      background: theme.colors.surfaceElevated,
      pressed: theme.colors.surfaceMuted,
      border: 'transparent',
      text: theme.colors.text,
    },
    outline: {
      background: 'transparent',
      pressed: theme.colors.surfaceMuted,
      border: theme.colors.border,
      text: theme.colors.text,
    },
    ghost: {
      background: 'transparent',
      pressed: theme.colors.primarySoft,
      border: 'transparent',
      text: theme.colors.primary,
    },
    danger: {
      background: theme.colors.danger,
      pressed: theme.colors.danger,
      border: 'transparent',
      text: theme.colors.onPrimary,
    },
    success: {
      background: theme.colors.success,
      pressed: theme.colors.success,
      border: 'transparent',
      text: theme.colors.onPrimary,
    },
  }[variant];

  const iconSize = size === 'sm' ? theme.iconSizes.sm : theme.iconSizes.md;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={size === 'sm' ? hitSlopValue : undefined}
      style={({ pressed }) => {
        const isPressed = pressed && !isDisabled;
        // Background swap IS the feedback where a pressed tint exists; the
        // remaining variants fall back to a small opacity drop.
        const swapsBackground = palette.pressed !== palette.background;
        return [
          styles.base,
          {
            height: heights[size],
            paddingHorizontal: size === 'sm' ? spacing.md : spacing.lg,
            backgroundColor: isPressed ? palette.pressed : palette.background,
            borderColor: palette.border,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: radius.md,
            opacity: isDisabled ? 0.5 : isPressed && !swapsBackground ? PRESSED_OPACITY : 1,
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
          },
          style,
        ];
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={iconSize} color={palette.text} /> : null}
          <Text variant="button" style={{ color: palette.text }}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
