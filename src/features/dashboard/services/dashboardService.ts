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

export class DashboardService {
  private readonly basePath = '/reports';

  static buildDateRange(preset: DateRangePreset): { startDate?: string; endDate?: string; groupBy?: 'day' | 'week' | 'month' } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const format = (d: Date) => d.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        // Default to last 7 days for better trend visualization
        const s = new Date(today);
        s.setDate(s.getDate() - 6);
        return { startDate: format(s), endDate: format(today), groupBy: 'day' };
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
