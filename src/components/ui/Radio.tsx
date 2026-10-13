import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '@/providers/ThemeProvider';
import { MIN_TOUCH_TARGET, radius, spacing } from '@/theme';

export interface RadioProps {
  label?: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

/**
 * Single-select control. Use inside a group (one `Radio` per option, each
 * calling the same `onSelect` for its value); screens own the selected
 * value - this component only renders one option.
 */
export function Radio({ label, selected, onSelect, disabled = false }: RadioProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onSelect}
      style={({ pressed }) => [styles.row, { opacity: disabled ? 0.5 : pressed ? 0.72 : 1 }]}
    >
      <View
        style={[
          styles.ring,
          {
            borderColor: selected ? theme.colors.primary : theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        {selected ? <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} /> : null}
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
  ring: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
});
