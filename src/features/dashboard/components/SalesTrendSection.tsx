import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { Card, SectionHeader, Skeleton, Text } from '@/components/ui';
import { ErrorState } from '@/components/feedback';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatCurrencyCompact } from '@/utils/format';
import type { SalesTrendData } from '../types';

/**
 * Lightweight sales trend bar chart built from plain Views - no charting
 * dependency (Step 1 rule: dependencies must justify themselves). Series
 * values come from the backend sales report (netSales per period); the chart
 * only visualizes them.
 *
 * Accessibility: every bar carries an accessibilityLabel with its period and
 * value, and a textual total is rendered above the chart.
 */
export function SalesTrendSection({
  data,
  isLoading,
  error,
  onRetry,
}: {
  data: SalesTrendData | undefined;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  if (error && !data) {
    return (
      <View>
        <SectionHeader title="Sales trend" />
        <Card>
          <ErrorState message={error} onRetry={onRetry} />
        </Card>
      </View>
    );
  }

  if (isLoading && !data) {
    return (
      <View>
        <SectionHeader title="Sales trend" />
        <Card>
          <Skeleton height={140} />
        </Card>
      </View>
    );
  }

  if (!data || data.series.length === 0) {
    return (
      <View>
        <SectionHeader title="Sales trend" />
        <Card>
          <Text variant="body" tone="muted">
            No sales in this period.
          </Text>
        </Card>
      </View>
    );
  }

  const max = Math.max(...data.series.map((row) => row.netSales), 1);
  const total = data.series.reduce((sum, row) => sum + row.netSales, 0);
  // Cap bars on small screens: ~12 bars stay readable on a 320pt width.
  const series = data.series.slice(-14);
  const barArea = Math.max(width - spacing.lg * 4, 240);
  const barWidth = Math.max(
    Math.floor((barArea - (series.length - 1) * spacing.xs) / series.length),
    6,
  );

  return (
    <View>
      <SectionHeader title="Sales trend" />
      <Card accessibilityLabel={`Sales trend, total ${formatCurrencyCompact(total)}`}>
        <Text variant="subtitle">{formatCurrencyCompact(total)}</Text>
        <Text variant="caption" tone="muted">
          Net sales, last {series.length}{' '}
          {data.dateGrouping === 'day' ? 'days' : data.dateGrouping + 's'}
        </Text>
        <View style={styles.chart}>
          {series.map((row, index) => {
            const height = Math.max(
              Math.round((row.netSales / max) * 96),
              row.netSales > 0 ? 4 : 1,
            );
            return (
              <View
                key={`${row.period}-${index}`}
                style={[styles.barSlot, { width: barWidth }]}
                accessibilityLabel={`${row.period}: ${formatCurrencyCompact(row.netSales)}`}
              >
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor:
                        row.netSales > 0 ? theme.colors.primary : theme.colors.surfaceMuted,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    height: 104,
    marginTop: spacing.sm,
  },
  barSlot: { alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: { width: '100%', borderRadius: radius.sm },
});
