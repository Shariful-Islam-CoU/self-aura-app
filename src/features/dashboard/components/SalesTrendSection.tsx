import { StyleSheet, View, useWindowDimensions, ScrollView } from 'react-native';

import { Card, SectionHeader, Skeleton, Text } from '@/components/ui';
import { ErrorState } from '@/components/feedback';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatCurrencyCompact } from '@/utils/format';
import type { SalesTrendData } from '../types';
import { LineChart } from 'react-native-chart-kit';

/**
 * Sales trend line chart using react-native-chart-kit/v2.
 * Displays net sales over time with proper axis formatting.
 *
 * Props:
 * - data: SalesTrendData from the backend (series + dateGrouping)
 * - isLoading: boolean for loading state
 * - error: error message if any
 * - onRetry: callback for retry button
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
          <Skeleton height={200} />
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

  // Prepare chart data
  const series = data.series;
  const total = series.reduce((sum, row) => sum + row.netSales, 0);

  // Primary color in hex for chart
  const primaryColor = theme.colors.primary;

  // Format X-axis labels to show only day numbers (e.g., "11", "12", "13")
  // Assuming period format is "YYYY-MM-DD" or similar
  const formatDayLabel = (period: string): string => {
    // Try to parse date and extract day
    const match = period.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return match[3]; // Return day part only
    }
    // Fallback: try to get last 2 characters if it's a day number
    if (/^\d+$/.test(period.slice(-2))) {
      return period.slice(-2);
    }
    return period;
  };

  const chartLabels = series.map((row) => formatDayLabel(row.period));

  // Calculate chart width for horizontal scrolling
  // Each data point needs ~48px for readability
  const pointWidth = 48;
  const chartWidth = Math.max(width - spacing.lg * 2, series.length * pointWidth);

  // Format chart data for react-native-chart-kit
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: series.map((row) => row.netSales),
        color: (opacity: number) => primaryColor + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
        strokeWidth: 3,
      },
    ],
    legend: ['Net Sales'],
  };

  // Chart configuration
  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity: number) => primaryColor + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
    labelColor: (opacity: number) => theme.colors.textMuted + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
    style: {
      borderRadius: radius.md,
    },
    propsForDots: {
      r: 4,
      strokeWidth: 2,
      stroke: primaryColor,
    },
  };

  /**
   * Y-axis tick label: compact BDT with Latin (English) digits.
   *
   * The axis always uses a K/M/B magnitude rather than raw taka, so every tick
   * reads on the same scale instead of mixing "৳320" with "৳45.6K". Values from
   * 100 up switch to K (320 -> `৳0.3K`); only genuinely tiny ticks stay plain so
   * they never collapse to a misleading "৳0.0K".
   *
   * Bengali digits are intentionally not used here: currency elsewhere matches
   * the web client, but an axis is a measuring scale scanned at a glance, and
   * 10px Bengali numerals are hard to read. The ৳ stays so the scale says what
   * it measures.
   */
  const formatAxisValue = (value: number): string => {
    const abs = Math.abs(value);
    const unit =
      abs >= 1e9
        ? { div: 1e9, suffix: 'B' }
        : abs >= 1e6
          ? { div: 1e6, suffix: 'M' }
          : abs >= 100
            ? { div: 1e3, suffix: 'K' }
            : null;

    if (!unit) return `৳${Math.round(value)}`;

    // One decimal, keeping the scale consistent ("45.0K", not "45K" next to
    // "1.2M") so tick labels stay aligned and comparable.
    return `৳${(value / unit.div).toFixed(1)}${unit.suffix}`;
  };

  /**
   * Y-axis ticks.
   *
   * chart-kit scales the grid to the data's maximum on its own, but its labels
   * were switched off entirely, so the line had no readable magnitude. The tick
   * count is derived from the plot height (~1 per 40px).
   */
  const CHART_HEIGHT = 200;
  const tickCount = Math.max(3, Math.min(5, Math.round(CHART_HEIGHT / 40)));

  /**
   * Left inset for the plot area, sized to the longest tick label.
   *
   * chart-kit treats `paddingRight` in the chart `style` as the plot's LEFT
   * inset, so this is the only thing standing between the Y labels and the
   * line. It is computed rather than fixed: a small range ("৳500") needs far
   * less gutter than "৳1.2M", and a hardcoded value left an empty gap on small
   * amounts. The tallest tick is the top of the scale (the data maximum), so
   * that one label decides the width.
   */
  const maxNetSales = Math.max(...series.map((row) => row.netSales), 0);
  const leftInset = Math.round(formatAxisValue(maxNetSales).length * 6 + 8);

  return (
    <View>
      <SectionHeader title="Sales trend" />
      <Card accessibilityLabel={`Sales trend, total ${formatCurrencyCompact(total)}`}>
        <Text variant="subtitle">{formatCurrencyCompact(total)}</Text>
        <Text variant="caption" tone="muted">
          Net sales over {series.length}{' '}
          {data.dateGrouping === 'day' ? 'days' : data.dateGrouping + 's'}
        </Text>
        <View style={styles.chartContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            <LineChart
              data={chartData}
              width={chartWidth}
              height={CHART_HEIGHT}
              chartConfig={{ ...chartConfig, propsForLabels: { fontSize: 10 } }}
              bezier
              style={{ ...styles.chart, paddingRight: leftInset }}
              verticalLabelRotation={30}
              withHorizontalLabels
              fromZero
              segments={tickCount}
              yAxisLabel=""
              yAxisSuffix=""
              yLabelsOffset={2}
              formatYLabel={(value) => formatAxisValue(Number(value))}
            />
          </ScrollView>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    marginTop: spacing.sm,
  },
  scrollView: {
    // Allow horizontal scrolling
  },
  scrollContent: {
    // No left padding: the card already pads, and the chart's own left inset
    // (computed in the component) is all the room the Y labels need.
    marginLeft: -10,
    paddingRight: spacing.lg, // Right padding for the last X label
  },
  chart: {
    borderRadius: radius.md,
    // `paddingRight` is set inline from the measured tick-label width - see
    // `leftInset` in the component.
  },
});