import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getErrorMessage } from '@/api';
import { ErrorState } from '@/components/feedback';
import { Card, Skeleton, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import type { IconName } from '@/types';
import { formatNumber } from '@/utils/format';
import { useCustomerStats } from '../queries';

interface StatRow {
  key: string;
  label: string;
  value: number;
  icon: IconName;
  tone: 'primary' | 'success' | 'warning' | 'info';
}

/**
 * Business-wide customer statistics from `GET /reports/customers`
 * (backend-computed - no client math). Renders the same three figures the
 * web app's customers page shows: all-time totals plus new customers for
 * the report period, which defaults to the current month. The screen only
 * mounts this when the user has `reports.customers`, and backend 403s
 * remain authoritative if access changes.
 */
export function CustomerStatsSection() {
  const { theme } = useTheme();
  const statsQuery = useCustomerStats();

  if (statsQuery.isPending) {
    return (
      <Card style={styles.card}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.row}>
            <View style={[styles.icon, { backgroundColor: theme.colors.surfaceMuted }]} />
            <SkeletonLine />
          </View>
        ))}
      </Card>
    );
  }

  if (statsQuery.isError) {
    return (
      <ErrorState
        title="Failed to load statistics"
        message={getErrorMessage(statsQuery.error)}
        onRetry={() => void statsQuery.refetch()}
        retryLabel="Retry"
      />
    );
  }

  const { totals } = statsQuery.data;
  const stats: StatRow[] = [
    {
      key: 'total',
      label: 'Total customers',
      value: totals.totalCustomers,
      icon: 'people-outline',
      tone: 'info',
    },
    {
      key: 'active',
      label: 'Active customers',
      value: totals.activeCustomers,
      icon: 'person-outline',
      tone: 'success',
    },
    {
      key: 'new',
      label: 'New customers (this month)',
      value: totals.newCustomers,
      icon: 'person-add-outline',
      tone: 'primary',
    },
  ];

  return (
    <Card style={styles.card}>
      {stats.map((stat) => (
        <View key={stat.key} style={styles.row}>
          <View style={[styles.icon, { backgroundColor: theme.colors[`${stat.tone}Soft`] }]}>
            <Ionicons name={stat.icon} size={16} color={theme.colors[`${stat.tone}OnSoft`]} />
          </View>
          <Text variant="bodySmall" tone="secondary" style={styles.label} numberOfLines={2}>
            {stat.label}
          </Text>
          <Text variant="subtitle" numberOfLines={1}>
            {formatNumber(stat.value)}
          </Text>
        </View>
      ))}
    </Card>
  );
}

function SkeletonLine() {
  return (
    <View style={styles.skeletonWrap}>
      <Skeleton width="45%" height={14} />
      <Skeleton width={48} height={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 32,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1 },
  skeletonWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
