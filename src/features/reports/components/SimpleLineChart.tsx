import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

interface SimpleLineChartProps {
  data: Array<{ period: string; [key: string]: any }>;
  color?: string;
  height?: number;
  formatValue?: (val: number) => string;
  valueKey?: string;
}

export function SimpleLineChart({ data, color = '#3b82f6', height = 200, formatValue, valueKey = 'netSales' }: SimpleLineChartProps) {
  const { theme } = useTheme();
  if (!data || data.length === 0) {
    return (
      <View style={{ height, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.textMuted }}>No data</Text>
      </View>
    );
  }

  const values = data.map((d) => Number(d[valueKey] ?? 0));
  const maxVal = Math.max(...values, 1);

  return (
    <View style={{ height, width: '100%' }}>
      <Text style={{ textAlign: 'center', marginBottom: 8, color: theme.colors.textMuted, fontSize: 12 }}>
        {data[data.length - 1]?.[valueKey] !== undefined
          ? formatValue
            ? formatValue(data[data.length - 1][valueKey])
            : String(data[data.length - 1][valueKey])
          : ''}
      </Text>
      <View style={styles.chartWrapper}>
        {data.map((d, i) => (
          <View key={i} style={styles.bar}>
            <View style={{ height: Math.max(4, (Number(d[valueKey] ?? 0) / maxVal) * (height - 40)), backgroundColor: color }} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartWrapper: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: 8 },
  bar: { flex: 1, maxWidth: 20, borderRadius: 2 },
});