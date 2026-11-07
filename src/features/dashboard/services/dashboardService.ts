import { apiClient, type ApiEnvelope } from '@/api';
import type {
  DashboardData,
  DateRangePreset,
  LowStockProduct,
  RecentOrder,
  SalesTrendData,
  SalesSeriesRow,
} from '../types';

export interface DashboardQuery {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}

interface OrderListData {
  orders: {
    id: string;
    orderNumber: string;
    customer?: { id?: string; name?: string };
    createdAt: string;
    total: number;
    orderStatus: string;
    paymentStatus: string;
    items?: unknown[];
  }[];
}

interface LowStockApiItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
}

/** Local `YYYY-MM-DD`. Never `toISOString()` - see `buildDateRange`. */
const formatLocalDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;

/** Midnight today in the device's own timezone. */
const localToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const daysAgo = (days: number): Date => {
  const d = localToday();
  d.setDate(d.getDate() - days);
  return d;
};

export class DashboardService {
  private readonly basePath = '/reports';

  static buildDateRange(preset: DateRangePreset): { startDate?: string; endDate?: string; groupBy?: 'day' | 'week' | 'month' } {
    const today = localToday();
    /**
     * Local `YYYY-MM-DD`.
     *
     * NOT `toISOString()`: that converts local midnight to UTC, which for
     * UTC+6 (Bangladesh) lands on the previous day. The backend parses the value
     * as UTC midnight and expands it to whole UTC days, so a shifted date asked
     * for the wrong window and today's numbers could silently be missing - no
     * amount of refreshing fixes that, the request itself was asking the wrong
     * question.
     */
    const format = formatLocalDate;

    switch (preset) {
      case 'today':
        // KPIs: today only. This used to share the 7-day window below, which
        // made the "Today" and "7 days" chips identical - same request, same
        // query key, same numbers, so switching between them did nothing.
        return { startDate: format(today), endDate: format(today), groupBy: 'day' };
      case 'yesterday': {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        return { startDate: format(y), endDate: format(y), groupBy: 'day' };
      }
      case 'last7days': {
        const s = new Date(today);
        s.setDate(s.getDate() - 6);
        return { startDate: format(s), endDate: format(today), groupBy: 'day' };
      }
      case 'last30days': {
        const s = new Date(today);
        s.setDate(s.getDate() - 29);
        return { startDate: format(s), endDate: format(today), groupBy: 'day' };
      }
      case 'thisMonth': {
        const s = new Date(today.getFullYear(), today.getMonth(), 1);
        return { startDate: format(s), endDate: format(today), groupBy: 'day' };
      }
      case 'previousMonth': {
        const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const e = new Date(today.getFullYear(), today.getMonth(), 0);
        return { startDate: format(s), endDate: format(e), groupBy: 'day' };
      }
      case 'custom':
      default:
        return { groupBy: 'day' };
    }
  }

  /**
   * Window the **sales trend chart** plots.
   *
   * Deliberately not the KPI window: a single day is one point, which is not a
   * trend. "Today" and "7 days" both plot the last 7 days; anything longer plots
   * its own window. The KPI cards above still show exactly the selected period,
   * so the chart and the numbers answer different questions on purpose - and the
   * card says which one it is showing.
   */
  static buildTrendRange(
    preset: DateRangePreset,
  ): { startDate?: string; endDate?: string; groupBy?: 'day' | 'week' | 'month' } {
    switch (preset) {
      case 'today':
      case 'yesterday':
      case 'last7days':
        return {
          startDate: formatLocalDate(daysAgo(6)),
          endDate: formatLocalDate(localToday()),
          groupBy: 'day',
        };
      case 'last30days':
        return {
          startDate: formatLocalDate(daysAgo(29)),
          endDate: formatLocalDate(localToday()),
          groupBy: 'day',
        };
      case 'thisMonth':
        return {
          startDate: formatLocalDate(
            new Date(localToday().getFullYear(), localToday().getMonth(), 1),
          ),
          endDate: formatLocalDate(localToday()),
          groupBy: 'day',
        };
      case 'previousMonth': {
        const today = localToday();
        return {
          startDate: formatLocalDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
          endDate: formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 0)),
          groupBy: 'day',
        };
      }
      case 'custom':
      default:
        // No explicit range: the backend answers for the current month.
        return { groupBy: 'day' };
    }
  }

  async getDashboard(query: DashboardQuery = {}): Promise<DashboardData> {
    const res = await apiClient.get<ApiEnvelope<DashboardData>>(`${this.basePath}/dashboard`, {
      params: query as unknown as Record<string, string | number | boolean | null | undefined>,
    });
    return res.data;
  }

  async getSalesTrend(
    query: DashboardQuery & { groupBy?: 'day' | 'week' | 'month' } = {},
  ): Promise<SalesTrendData> {
    const groupBy = query.groupBy || 'day';
    const params: Record<string, string | number | boolean | null | undefined> = {
      ...query,
      groupBy,
    };
    const res = await apiClient.get<ApiEnvelope<{ series: SalesSeriesRow[] }>>(
      `${this.basePath}/sales`,
      { params },
    );
    return { series: res.data.series || [], dateGrouping: groupBy };
  }

  async getRecentOrders(limit = 10): Promise<RecentOrder[]> {
    const res = await apiClient.get<ApiEnvelope<OrderListData>>('/orders', {
      params: { page: 1, limit, sortBy: 'createdAt', sortOrder: 'desc' },
    });
    return (res.data.orders || []).slice(0, limit).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customer?.name || 'Unknown',
      customerId: o.customer?.id,
      date: o.createdAt,
      total: o.total,
      status: o.orderStatus,
      paymentStatus: o.paymentStatus,
      itemsCount: Array.isArray(o.items) ? o.items.length : 0,
    }));
  }

  async getLowStockProducts(): Promise<LowStockProduct[]> {
    const res =
      await apiClient.get<ApiEnvelope<{ items: LowStockApiItem[] }>>('/inventory/low-stock');
    return (res.data.items || []).map((i) => ({
      id: i.id,
      name: i.name,
      sku: i.sku,
      currentStock: i.stock,
      minStockLevel: i.lowStockThreshold,
    }));
  }
}

export const dashboardService = new DashboardService();
