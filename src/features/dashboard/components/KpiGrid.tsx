import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatCurrency, formatNumber } from '@/utils/format';
import type { IconName } from '@/types';
import type { DashboardData } from '../types';

interface Kpi {
  key: string;
  label: string;
  value: string;
  icon: IconName;
  tone: 'primary' | 'success' | 'warning' | 'info';
}

/**
 * Primary KPI grid - backend-calculated values only (no client math).
 * Renders in a 2-column layout that stays readable on small screens.
 */
export function KpiGrid({ data }: { data: DashboardData }) {
  const { theme } = useTheme();

  const kpis: Kpi[] = [
    {
      key: 'sales',
      label: 'Net sales',
      value: formatCurrency(data.sales.netSales),
      icon: 'trending-up-outline',
      tone: 'primary',
    },
    {
      key: 'orders',
      label: 'Orders',
      value: formatNumber(data.sales.orderCount),
      icon: 'receipt-outline',
      tone: 'info',
    },
    {
      key: 'profit',
      label: 'Net profit',
      value: formatCurrency(data.netProfit),
      icon: 'cash-outline',
      tone: 'success',
    },
    {
      key: 'inventory',
      label: 'Inventory (cost)',
      value: formatCurrency(data.inventory.costValue),
      icon: 'cube-outline',
      tone: 'info',
    },
  ];

  return (
    <View style={styles.grid}>
      {kpis.map((kpi) => (
        <Card key={kpi.key} style={styles.card} accessibilityLabel={`${kpi.label}: ${kpi.value}`}>
          <View style={[styles.icon, { backgroundColor: theme.colors[`${kpi.tone}Soft`] }]}>
            <Ionicons name={kpi.icon} size={18} color={theme.colors[`${kpi.tone}OnSoft`]} />
          </View>
          <Text variant="bodySmall" tone="muted" numberOfLines={1}>
            {kpi.label}
          </Text>
          <Text variant="h2" numberOfLines={1} adjustsFontSizeToFit>
            {kpi.value}
          </Text>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { flexGrow: 1, flexBasis: '45%', gap: spacing.xs },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});
