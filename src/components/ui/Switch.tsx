import { Pressable, StyleSheet, Switch as RNSwitch, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '@/providers/ThemeProvider';
import { MIN_TOUCH_TARGET, spacing } from '@/theme';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Optional visible label rendered next to the control. */
  label?: string;
  /** Accessible name for bare switches (no visible label). */
  accessibilityLabel?: string;
  disabled?: boolean;
}

/**
 * Themed wrapper around the native switch (no extra dependency). With a
 * label the whole row is the touch target (>= 44pt) and the only element
 * exposed to assistive tech, so the switch is never announced twice.
 */
export function Switch({
  value,
  onValueChange,
  label,
  accessibilityLabel,
  disabled = false,
}: SwitchProps) {
  const { theme } = useTheme();

  const control = (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
      thumbColor={theme.colors.surface}
      ios_backgroundColor={theme.colors.border}
    />
  );

  if (!label) return control;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [styles.row, { opacity: disabled ? 0.5 : pressed ? 0.72 : 1 }]}
    >
      <Text variant="body" style={styles.label}>
        {label}
      </Text>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {control}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  label: {
    flex: 1,
  },
});
