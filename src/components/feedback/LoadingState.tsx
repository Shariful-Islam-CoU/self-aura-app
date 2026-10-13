import { StyleSheet, View } from 'react-native';
import { Skeleton } from '@/components/ui';
import { spacing } from '@/theme';
import { LoadingIndicator } from './LoadingIndicator';

export interface LoadingStateProps {
  /**
   * `rows` (default) = list of skeleton rows (the "no ugly centered
   * spinner" rule); `spinner` = compact labeled spinner for small areas.
   */
  variant?: 'rows' | 'spinner';
  /** Number of skeleton rows (default: 5). */
  rows?: number;
  /** Label for the spinner variant. */
  label?: string;
}

const ROW_WIDTHS = ['72%', '58%', '80%', '64%', '70%'] as const;

/**
 * Loading presentation for the first step of loading -> success -> empty ->
 * error. Rows give a stable, non-jumpy placeholder for lists; the spinner
 * variant is reserved for small in-place refreshes.
 */
export function LoadingState({ variant = 'rows', rows = 5, label }: LoadingStateProps) {
  if (variant === 'spinner') {
    return <LoadingIndicator label={label} />;
  }

  return (
    <View
      style={styles.rows}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
    >
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={styles.row}>
          <Skeleton circle width={40} height={40} />
          <View style={styles.lines}>
            <Skeleton width={ROW_WIDTHS[index % ROW_WIDTHS.length] ?? '70%'} height={13} />
            <Skeleton width="45%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rows: {
    gap: spacing.xl,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  lines: {
    flex: 1,
    gap: spacing.sm,
  },
});
