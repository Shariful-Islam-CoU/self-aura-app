import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Skeleton, Text } from '@/components/ui';
import type { InventoryTotals } from '@/features/inventory/types';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatNumber } from '@/utils/format';
import type { IconName } from '@/types';

export interface ProductTotalsBarProps {
  /** Backend-computed catalogue totals (`GET /reports/inventory`). */
  totals: InventoryTotals | undefined;
  isLoading: boolean;
}

/**
 * Compact catalogue summary above the product list: total products and total
 * units in stock. Both values come from `GET /reports/inventory` - the same
 * backend aggregate the inventory screen reads - so nothing is counted from
 * the loaded pages and no stock math happens client-side.
 */
export function ProductTotalsBar({ totals, isLoading }: ProductTotalsBarProps) {
  const { theme } = useTheme();

  if (isLoading && !totals) {
    return (
      <Card style={styles.card}>
        <View style={styles.stat}>
          <Skeleton width={32} height={32} radius={8} />
          <View style={styles.statText}>
            <Skeleton width="60%" height={12} />
            <Skeleton width="40%" height={20} />
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.stat}>
          <Skeleton width={32} height={32} radius={8} />
          <View style={styles.statText}>
            <Skeleton width="60%" height={12} />
            <Skeleton width="40%" height={20} />
          </View>
        </View>
      </Card>
    );
  }

  if (!totals) return null;

  const stats: {
    key: string;
    label: string;
    value: number;
    icon: IconName;
    tone: 'primary' | 'info';
  }[] = [
    {
      key: 'products',
      label: 'Total products',
      value: totals.totalProducts,
      icon: 'cube-outline',
      tone: 'primary',
    },
    {
      key: 'units',
      label: 'Total units in stock',
      value: totals.totalStockUnits,
      icon: 'layers-outline',
      tone: 'info',
    },
  ];

  return (
    <Card
      style={styles.card}
      accessibilityLabel={stats
        .map((stat) => `${stat.label}: ${formatNumber(stat.value)}`)
        .join('. ')}
    >
      {stats.map((stat, index) => (
        <View key={stat.key} style={styles.stat}>
          {index > 0 ? (
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          ) : null}
          <View style={[styles.icon, { backgroundColor: theme.colors[`${stat.tone}Soft`] }]}>
            <Ionicons name={stat.icon} size={18} color={theme.colors[`${stat.tone}OnSoft`]} />
          </View>
          <View style={styles.statText}>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {stat.label}
            </Text>
            <Text variant="h3" numberOfLines={1} adjustsFontSizeToFit>
              {formatNumber(stat.value)}
            </Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statText: { flexShrink: 1, flexGrow: 1, gap: 2 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginRight: spacing.sm,
  },
});
