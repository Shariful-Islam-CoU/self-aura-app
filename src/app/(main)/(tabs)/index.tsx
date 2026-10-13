import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { AppHeader, Screen } from '@/components/layout';
import { IconButton } from '@/components/ui';
import { ErrorState } from '@/components/feedback';
import { dashboardModule } from '@/navigation';
import { useAuth } from '@/providers';
import { usePermissions } from '@/hooks/usePermissions';
import { getErrorMessage } from '@/api';
import { spacing } from '@/theme';
import { DashboardService } from '@/features/dashboard/services/dashboardService';
import { DashboardSkeleton } from '@/features/dashboard/components/DashboardSkeleton';
import { KpiGrid } from '@/features/dashboard/components/KpiGrid';
import { PeriodSelector } from '@/features/dashboard/components/PeriodSelector';
import { SalesTrendSection } from '@/features/dashboard/components/SalesTrendSection';
import { RecentOrdersSection } from '@/features/dashboard/components/RecentOrdersSection';
import { LowStockSection } from '@/features/dashboard/components/LowStockSection';
import {
  dashboardKeys,
  useDashboardSummary,
  useLowStockProducts,
  useRecentOrders,
  useSalesTrend,
} from '@/features/dashboard/queries';
import type { DateRangePreset } from '@/features/dashboard/types';

const logo = require('../../../../assets/logo2.png');

/**
 * Dashboard (Home tab). Backend reports only - every number is calculated
 * by the API, never re-derived on the client.
 *
 * Sections are permission-aware (Step 7): sales trend needs reports.sales,
 * recent orders needs orders.view, low stock needs inventory.view. The
 * backend stays authoritative - gates only hide UI the user can't use.
 */
export default function HomeScreen() {
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const queryClient = useQueryClient();

  const [preset, setPreset] = useState<DateRangePreset>('today');
  const [refreshing, setRefreshing] = useState(false);

  const dashboardPermissions = Array.isArray(dashboardModule.permission)
    ? dashboardModule.permission
    : [dashboardModule.permission];
  const canViewDashboard = hasAnyPermission(dashboardPermissions);
  const canViewSales = hasPermission('reports.sales');
  const canViewOrders = hasPermission('orders.view');
  const canViewInventory = hasPermission('inventory.view');

  const range = useMemo(() => DashboardService.buildDateRange(preset), [preset]);

  const summary = useDashboardSummary(range);
  const trend = useSalesTrend(range, 'day', canViewDashboard && canViewSales);
  const recentOrders = useRecentOrders(5, canViewDashboard && canViewOrders);
  const lowStock = useLowStockProducts(canViewDashboard && canViewInventory);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Prefix invalidation: refetches summary/trend/orders/low-stock together
      // so the dashboard never shows a mix of old and new data.
      await queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    } finally {
      setRefreshing(false);
    }
  };

  const header = (
    <AppHeader
      variant="dashboard"
      title="Self Aura"
      subtitle={user?.name ? `Hello, ${user.name}` : 'Management'}
      logo={logo}
      actions={
        <IconButton
          icon="notifications-outline"
          accessibilityLabel="Notifications"
          onPress={() => router.push('/notifications')}
        />
      }
    />
  );

  if (!canViewDashboard) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Access denied"
          message="You don't have permission to view the dashboard."
        />
      </Screen>
    );
  }

  if (summary.isPending && !summary.data) {
    return (
      <Screen>
        {header}
        <DashboardSkeleton />
      </Screen>
    );
  }

  if (summary.isError && !summary.data) {
    return (
      <Screen refreshControl={{ refreshing, onRefresh }}>
        {header}
        <ErrorState
          title="Failed to load dashboard"
          message={getErrorMessage(summary.error)}
          onRetry={() => void summary.refetch()}
          retryLabel="Retry"
        />
      </Screen>
    );
  }

  if (!summary.data) return null;

  return (
    <Screen scroll refreshControl={{ refreshing, onRefresh }}>
      {header}
      <View style={styles.container}>
        <PeriodSelector value={preset} onChange={setPreset} disabled={refreshing} />

        <KpiGrid data={summary.data} />

        {canViewSales ? (
          <SalesTrendSection
            data={trend.data}
            isLoading={trend.isLoading}
            error={trend.isError ? getErrorMessage(trend.error) : null}
            onRetry={() => void trend.refetch()}
          />
        ) : null}

        {canViewOrders ? (
          <RecentOrdersSection
            orders={recentOrders.data}
            isLoading={recentOrders.isLoading}
            error={recentOrders.isError ? getErrorMessage(recentOrders.error) : null}
            onRetry={() => void recentOrders.refetch()}
            onOpenOrder={(orderId) => router.push(`/orders/${orderId}`)}
            onSeeAll={() => router.push('/orders')}
          />
        ) : null}

        {canViewInventory ? (
          <LowStockSection
            products={lowStock.data}
            isLoading={lowStock.isLoading}
            error={lowStock.isError ? getErrorMessage(lowStock.error) : null}
            onRetry={() => void lowStock.refetch()}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
});
