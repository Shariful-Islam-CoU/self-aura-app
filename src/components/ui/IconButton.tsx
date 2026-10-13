import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import { MIN_TOUCH_TARGET, radius } from '@/theme';
import type { IconName } from '@/types';

export interface IconButtonProps {
  /** Ionicons glyph name. */
  icon: IconName;
  accessibilityLabel: string;
  onPress?: () => void;
  size?: number;
  color?: string;
  /** Optional circular background (e.g. for header buttons). */
  filled?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Icon-only button. The box is a full 44pt touch target (guideline
 * minimum) and the accessible label is mandatory - icons never ship
 * unlabeled.
 */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  size = 22,
  color,
  filled = false,
  disabled = false,
  style,
}: IconButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        filled && {
          backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surfaceElevated,
          borderRadius: radius.pill,
        },
        { opacity: disabled ? 0.4 : pressed ? 0.72 : 1 },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color ?? theme.colors.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
