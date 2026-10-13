import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { reportService } from './services/reportService';
import type {
  ReportFilters,
  DateRangePreset,
} from './types';

export const reportsKeys = {
  all: ['reports'] as const,
  summary: (filters: ReportFilters) => ['reports', 'summary', filters] as const,
  sales: (filters: ReportFilters) => ['reports', 'sales', filters] as const,
  purchases: (filters: ReportFilters) => ['reports', 'purchases', filters] as const,
  payments: (filters: ReportFilters) => ['reports', 'payments', filters] as const,
  expenses: (filters: ReportFilters) => ['reports', 'expenses', filters] as const,
  profitLoss: (filters: ReportFilters) => ['reports', 'profitLoss', filters] as const,
  inventory: (filters: ReportFilters) => ['reports', 'inventory', filters] as const,
  inventoryMovements: (filters: ReportFilters) => ['reports', 'inventoryMovements', filters] as const,
  customers: (filters: ReportFilters) => ['reports', 'customers', filters] as const,
  returns: (filters: ReportFilters) => ['reports', 'returns', filters] as const,
  delivery: (filters: ReportFilters) => ['reports', 'delivery', filters] as const,
  products: (filters: ReportFilters) => ['reports', 'products', filters] as const,
  categories: (filters: ReportFilters) => ['reports', 'categories', filters] as const,
  dailySummary: (filters: ReportFilters) => ['reports', 'dailySummary', filters] as const,
  salesTrend: (filters: ReportFilters) => ['reports', 'sales', 'trend', filters] as const,
};

/** Date range helpers */
export function getDateRangeForPreset(preset: DateRangePreset): ReportFilters {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const format = (d: Date) => d.toISOString().split('T')[0];

  switch (preset) {
    case 'today':
      return { startDate: format(today), endDate: format(today) };
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { startDate: format(y), endDate: format(y) };
    }
    case 'last7days': {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      return { startDate: format(s), endDate: format(today) };
    }
    case 'last30days': {
      const s = new Date(today);
      s.setDate(s.getDate() - 29);
      return { startDate: format(s), endDate: format(today) };
    }
    case 'thisMonth': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: format(s), endDate: format(today) };
    }
    case 'previousMonth': {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: format(s), endDate: format(e) };
    }
    case 'custom':
    default:
      return {};
  }
}

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7days: 'Last 7 days',
  last30days: 'Last 30 days',
  thisMonth: 'This month',
  previousMonth: 'Previous month',
  custom: 'Custom range',
};

/** KPI summary for the selected period (backend-calculated totals). */
export function useReportSummary(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.summary(filters),
    queryFn: () => reportService.getDashboard(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Sales report */
export function useSalesReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.sales(filters),
    queryFn: () => reportService.getSales(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Purchases report */
export function usePurchasesReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.purchases(filters),
    queryFn: () => reportService.getPurchases(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Payments report */
export function usePaymentsReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.payments(filters),
    queryFn: () => reportService.getPayments(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Expenses report */
export function useExpensesReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.expenses(filters),
    queryFn: () => reportService.getExpenses(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Profit & Loss report */
export function useProfitLossReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.profitLoss(filters),
    queryFn: () => reportService.getProfitLoss(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Inventory report */
export function useInventoryReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.inventory(filters),
    queryFn: () => reportService.getInventory(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Inventory movements report */
export function useInventoryMovementsReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.inventoryMovements(filters),
    queryFn: () => reportService.getInventoryMovements(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Customers report */
export function useCustomersReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.customers(filters),
    queryFn: () => reportService.getCustomers(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Returns report */
export function useReturnsReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.returns(filters),
    queryFn: () => reportService.getReturns(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Delivery report */
export function useDeliveryReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.delivery(filters),
    queryFn: () => reportService.getDelivery(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Products report */
export function useProductsReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.products(filters),
    queryFn: () => reportService.getProducts(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Categories report */
export function useCategoriesReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.categories(filters),
    queryFn: () => reportService.getCategories(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Daily summary report */
export function useDailySummaryReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: reportsKeys.dailySummary(filters),
    queryFn: () => reportService.getDailySummary(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Sales trend for charts */
export function useSalesTrend(filters: ReportFilters = {}, enabled = true) {
  const trendFilters = filters as ReportFilters & { groupBy?: 'day' | 'week' | 'month' };
  return useQuery({
    queryKey: reportsKeys.salesTrend(trendFilters),
    queryFn: () => reportService.getSalesTrend(trendFilters),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Map of report IDs to their hook factories */
export type ReportType =
  | 'sales'
  | 'purchases'
  | 'payments'
  | 'expenses'
  | 'profitLoss'
  | 'inventory'
  | 'inventoryMovements'
  | 'customers'
  | 'returns'
  | 'delivery'
  | 'products'
  | 'categories'
  | 'dailySummary';

export const reportHooks = {
  sales: useSalesReport,
  purchases: usePurchasesReport,
  payments: usePaymentsReport,
  expenses: useExpensesReport,
  profitLoss: useProfitLossReport,
  inventory: useInventoryReport,
  inventoryMovements: useInventoryMovementsReport,
  customers: useCustomersReport,
  returns: useReturnsReport,
  delivery: useDeliveryReport,
  products: useProductsReport,
  categories: useCategoriesReport,
  dailySummary: useDailySummaryReport,
} as const;