import { useEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { radius, spacing } from '@/theme';

export interface SkeletonProps {
  /** Bar width (default: stretch to the container). */
  width?: DimensionValue;
  /** Bar height in dp (default: 12 - a text-line sized bar). */
  height?: number;
  radius?: number;
  /** Renders a stack of `lines` bars with realistic ragged widths. */
  lines?: number;
  /** Renders a circle instead of a bar (avatars). */
  circle?: boolean;
  style?: StyleProp<ViewStyle>;
}

const LINE_WIDTHS: DimensionValue[] = ['100%', '92%', '68%'];

/**
 * Shimmer placeholder block. The pulse is a single native-driver opacity
 * loop (cheap), and the whole tree is hidden from assistive tech -
 * screen readers hear the surrounding "Loading" label instead of every bar.
 */
export function Skeleton({ width, height, radius: corner, lines, circle, style }: SkeletonProps) {
  const { theme } = useTheme();
  // Lazy state init (not a ref): the value is read during render, and the
  // instance only needs to be stable across re-renders of this component.
  const [opacity] = useState(() => new Animated.Value(0.55));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const blockStyle = (blockWidth: DimensionValue, blockHeight: number): ViewStyle => ({
    width: blockWidth,
    height: blockHeight,
    borderRadius: circle ? blockHeight / 2 : (corner ?? radius.sm),
    backgroundColor: theme.colors.surfaceMuted,
  });

  const lineCount = lines ?? 1;

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.container, { opacity }, style]}
    >
      {Array.from({ length: lineCount }, (_, index) => {
        const isLine = Boolean(lines);
        const blockWidth = circle
          ? (width ?? height ?? 40)
          : isLine
            ? (LINE_WIDTHS[index % LINE_WIDTHS.length] ?? '100%')
            : (width ?? '100%');
        const blockHeight = circle ? (height ?? 40) : (height ?? 12);
        return <Animated.View key={index} style={blockStyle(blockWidth, blockHeight)} />;
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
