import { Pressable, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { pressFeedback } from './pressable';
import { useTheme } from '@/providers/ThemeProvider';
import { radius, spacing } from '@/theme';

export interface CardProps extends ViewProps {
  /** Renders the card as a tappable surface. */
  onPress?: () => void;
  padded?: boolean;
  style?: ViewStyle | ViewStyle[];
}

/**
 * The surface every block of content sits on: themed background, hairline
 * border (which carries structure in dark mode), subtle `sm` elevation and
 * a consistent `lg` corner.
 */
export function Card({ onPress, padded = true, style, children, ...rest }: CardProps) {
  const { theme } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: padded ? spacing.lg : 0,
    ...theme.shadows.sm,
  };

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && pressFeedback(pressed), style]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[cardStyle, style]} {...rest}>
      {children}
    </View>
  );
}
