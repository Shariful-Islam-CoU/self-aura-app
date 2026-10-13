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

  return (
    <View>
      <SectionHeader title="Sales trend" />
      <Card accessibilityLabel={`Sales trend, total ${formatCurrencyCompact(total)}`}>
        <Text variant="subtitle">{formatCurrencyCompact(total)}</Text>
        <Text variant="caption" tone="muted">
          Net sales, last {series.length}{' '}
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
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              verticalLabelRotation={30}
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
    paddingHorizontal: 0, // Remove left padding
  },
  scrollView: {
    // Allow horizontal scrolling
  },
  scrollContent: {
    paddingLeft: spacing.lg, // Add left padding for first label
    paddingRight: spacing.lg, // Add right padding for last label
  },
  chart: {
    borderRadius: radius.md,
  },
});