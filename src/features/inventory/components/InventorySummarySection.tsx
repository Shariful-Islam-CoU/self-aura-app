import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Skeleton, Text } from '@/components/ui';
import { ErrorState } from '@/components/feedback';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import type { IconName } from '@/types';
import { formatCurrency, formatNumber } from '@/utils/format';
import type { InventoryTotals } from '../types';

interface SummaryTile {
  key: string;
  label: string;
  value: string;
  icon: IconName;
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface InventorySummarySectionProps {
  totals: InventoryTotals | undefined;
  isLoading: boolean;
  /** User-safe error text; `null` while healthy. */
  error?: string | null;
  onRetry?: () => void;
}

/**
 * Backend-computed inventory summary (`GET /reports/inventory`, gated by
 * `reports.inventory` in the screen - a 403 still surfaces through the
 * error state, never faked). Renders in a 2-column layout that stays
 * readable on small screens; values are formatted only - never recalculated.
 */
export function InventorySummarySection({
  totals,
  isLoading,
  error,
  onRetry,
}: InventorySummarySectionProps) {
  const { theme } = useTheme();

  if (error) {
    return (
      <ErrorState
        title="Unable to load inventory summary."
        message={error}
        onRetry={onRetry}
        retryLabel="Try again"
      />
    );
  }

  if (isLoading && !totals) {
    return (
      <View style={styles.grid}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} style={styles.card}>
            <SkeletonBody />
          </Card>
        ))}
      </View>
    );
  }

  if (!totals) return null;

  const tiles: SummaryTile[] = [
    {
      key: 'products',
      label: 'Total products',
      value: formatNumber(totals.totalProducts),
      icon: 'cube-outline',
      tone: 'primary',
    },
    {
      key: 'units',
      label: 'Total units in stock',
      value: formatNumber(totals.totalStockUnits),
      icon: 'layers-outline',
      tone: 'info',
    },
    {
      key: 'low',
      label: 'Low stock products',
      value: formatNumber(totals.lowStockCount),
      icon: 'warning-outline',
      tone: 'warning',
    },
    {
      key: 'out',
      label: 'Out of stock products',
      value: formatNumber(totals.outOfStockCount),
      icon: 'close-circle-outline',
      tone: 'danger',
    },
    {
      key: 'value',
      label: 'Inventory value (cost)',
      value: formatCurrency(totals.costValue),
      icon: 'cash-outline',
      tone: 'success',
    },
  ];

  return (
    <View style={styles.grid}>
      {tiles.map((tile) => (
        <Card
          key={tile.key}
          style={styles.card}
          accessibilityLabel={`${tile.label}: ${tile.value}`}
        >
          <View style={[styles.icon, { backgroundColor: theme.colors[`${tile.tone}Soft`] }]}>
            <Ionicons name={tile.icon} size={18} color={theme.colors[`${tile.tone}OnSoft`]} />
          </View>
          <Text variant="bodySmall" tone="muted" numberOfLines={1}>
            {tile.label}
          </Text>
          <Text variant="h2" numberOfLines={1} adjustsFontSizeToFit>
            {tile.value}
          </Text>
        </Card>
      ))}
    </View>
  );
}

function SkeletonBody() {
  return (
    <View style={styles.skeletonBody}>
      <Skeleton width={32} height={32} radius={8} />
      <Skeleton width="70%" height={12} />
      <Skeleton width="50%" height={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { flexGrow: 1, flexBasis: '45%', gap: spacing.xs },
  skeletonBody: { gap: spacing.xs },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});
