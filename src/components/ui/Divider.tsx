import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing } from '@/theme';

export interface DividerProps {
  /** Adds vertical spacing around the line. */
  spaced?: boolean;
  style?: ViewStyle;
}

export function Divider({ spaced = false, style }: DividerProps) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityRole="none"
      style={[
        styles.line,
        {
          backgroundColor: theme.colors.border,
          marginVertical: spaced ? spacing.md : 0,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
