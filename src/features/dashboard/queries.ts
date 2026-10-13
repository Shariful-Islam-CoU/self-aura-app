import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { dashboardService } from './services/dashboardService';

/**
 * Dashboard query keys. Every key starts with 'dashboard' so a mutation in a
 * future module can invalidate the whole group (queryClient.invalidateQueries
 * with prefix matching) without knowing each sub-key.
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (range: { startDate?: string; endDate?: string }) =>
    ['dashboard', 'summary', range.startDate ?? '', range.endDate ?? ''] as const,
  trend: (range: { startDate?: string; endDate?: string }, groupBy: 'day' | 'week' | 'month') =>
    ['dashboard', 'trend', groupBy, range.startDate ?? '', range.endDate ?? ''] as const,
  recentOrders: (limit: number) => ['dashboard', 'recent-orders', limit] as const,
  lowStock: () => ['dashboard', 'low-stock'] as const,
};

/** KPI summary for the selected period (backend-calculated totals). */
export function useDashboardSummary(range: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: dashboardKeys.summary(range),
    queryFn: () => dashboardService.getDashboard(range),
    // Keep the previous period's numbers visible while the new period loads
    // so switching chips doesn't blank the whole screen.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Sales series for the trend chart; keeps previous data while the period changes. */
export function useSalesTrend(
  range: { startDate?: string; endDate?: string },
  groupBy: 'day' | 'week' | 'month',
  enabled: boolean,
) {
  return useQuery({
    queryKey: dashboardKeys.trend(range, groupBy),
    queryFn: () => dashboardService.getSalesTrend({ ...range, groupBy }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Small preview list only - never the whole order table. */
export function useRecentOrders(limit: number, enabled: boolean) {
  return useQuery({
    queryKey: dashboardKeys.recentOrders(limit),
    queryFn: () => dashboardService.getRecentOrders(limit),
    enabled,
    staleTime: 30_000,
  });
}

export function useLowStockProducts(enabled: boolean) {
  return useQuery({
    queryKey: dashboardKeys.lowStock(),
    queryFn: () => dashboardService.getLowStockProducts(),
    enabled,
    staleTime: 60_000,
  });
}
