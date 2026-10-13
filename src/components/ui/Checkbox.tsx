import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme } from '@/providers/ThemeProvider';
import { MIN_TOUCH_TARGET, radius, spacing } from '@/theme';

export interface CheckboxProps {
  label?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Square multi-select control. The whole row is the touch target (>= 44pt),
 * and the checked state is announced through `accessibilityState` rather
 * than conveyed by color alone (the check glyph carries the meaning).
 */
export function Checkbox({ label, checked, onCheckedChange, disabled = false }: CheckboxProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      style={({ pressed }) => [styles.row, { opacity: disabled ? 0.5 : pressed ? 0.72 : 1 }]}
    >
      <View
        style={[
          styles.box,
          {
            backgroundColor: checked ? theme.colors.primary : theme.colors.surface,
            borderColor: checked ? theme.colors.primary : theme.colors.border,
          },
        ]}
      >
        {checked ? <Ionicons name="checkmark" size={16} color={theme.colors.onPrimary} /> : null}
      </View>
      {label ? <Text variant="body">{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: radius.sm - 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
