import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '@/theme';

export interface ContainerProps {
  children: ReactNode;
  /** Horizontal page padding (default: true). */
  padded?: boolean;
  /** Vertical gap between children (default: `md`). */
  gap?: keyof typeof spacing;
  style?: StyleProp<ViewStyle>;
}

/**
 * Themed content column: consistent padding and rhythm without repeating
 * `flexDirection`/`gap` boilerplate. For screens use `Screen`; use this
 * for blocks inside a screen or modal.
 */
export function Container({ children, padded = true, gap = 'md', style }: ContainerProps) {
  return (
    <View
      style={[
        styles.base,
        {
          paddingHorizontal: padded ? spacing.lg : 0,
          gap: spacing[gap],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'stretch',
  },
});
