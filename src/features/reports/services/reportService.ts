import { apiClient, type ApiEnvelope } from '@/api';

import type {
  ReportSummary,
  SalesTrendData,
  ReportFilters,
  SalesSeriesRow,
} from '../types';

class ReportService {
  private readonly basePath = '/reports';

  private buildParams(filters: ReportFilters = {}): Record<string, string | number | boolean | undefined> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.productId) params.productId = filters.productId;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.customerId) params.customerId = filters.customerId;
    if (filters.supplierId) params.supplierId = filters.supplierId;
    if (filters.courierId) params.courierId = filters.courierId;
    if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
    if (filters.status) params.status = filters.status;
    if (filters.groupBy) params.groupBy = filters.groupBy;
    return params;
  }

  async getDashboard(filters: ReportFilters = {}): Promise<ReportSummary> {
    const res = await apiClient.get<ApiEnvelope<ReportSummary>>(`${this.basePath}/dashboard`, {
      params: this.buildParams(filters),
    });
    return res.data;
  }

  async getSales(filters: ReportFilters = {}): Promise<ReportSummary> {
    const res = await apiClient.get<ApiEnvelope<ReportSummary>>(`${this.basePath}/sales`, {
      params: this.buildParams(filters),
    });
    return res.data;
  }

  async getPurchases(filters: ReportFilters = {}): Promise<ReportSummary> {
    const res = await apiClient.get<ApiEnvelope<ReportSummary>>(`${this.basePath}/purchases`, {
      params: this.buildParams(filters),
    });
    return res.data;
  }

  async getPayments(filters: ReportFilters = {}): Promise<ReportSummary> {
    const res = await apiClient.get<ApiEnvelope<ReportSummary>>(`${this.basePath}/payments`, {
      params: this.buildParams(filters),
    });
    return res.data;
  }

  async getExpenses(filters: ReportFilters = {}): Promise<ReportSummary> {
    const res = await apiClient.get<ApiEnvelope<ReportSummary>>(`${this.basePath}/expenses`, {
      params: this.buildParams(filters),
    });
    return res.data;
  }

  async getProfitLoss(filters: ReportFilters = {}): Promise<ReportSummary> {
    const res = await apiClient.get<ApiEnvelope<ReportSummary>>(`${this.basePath}/profit-loss`, {
      params: this.buildParams(filters),
    });
    return res.data;
  }

  async getInventory(filters: ReportFilters = {}): Promise<ReportSummary> {
    const res = await apiClient.get<ApiEnvelope<ReportSummary>>(`${this.basePath}/inventory`, {
      params: this.buildParams(filters),
    });
    return res.data;
  }

  async getInventoryMovements(filters: ReportFilters = {}): Promise<ReportSummary> {
    const res = await apiClient.get<ApiEnvelope<ReportSummary>>(`${this.basePath}/inventory/movements`, {
      params: this.buildParams(filters),
    });
    return res.data;
  }

  async getCustomers(filters: ReportFilters = {}): Promise<ReportSummary> {
    const res = await apiClient.get<ApiEnvelope<ReportSummary>>(`${this.basePath}/customers`, {
      params: this.buildParams(filters),
    });
    return res.data;
  }

  async getReturns(filters: ReportFilters = {}): Promise<ReportSummary> {
    const res = await apiClient.get<ApiEnvelope<ReportSummary>>(`${this.basePath}/returns`, {
      params: this.buildParams(filters),
    });
    return res.data;
  }

  async getDelivery(filters: ReportFilters = {}): Promise<ReportSummary> {
    const res = await apiClient.get<ApiEnvelope<ReportSummary>>(`${this.basePath}/delivery`, {
      params: this.buildParams(filters),
    });
    return res.data;
  }

  async getProducts(filters: ReportFilters = {}): Promise<ReportSummary> {
    const res = await apiClient.get<ApiEnvelope<ReportSummary>>(`${this.basePath}/products`, {
      params: this.buildParams(filters),
    });
    return res.data;
  }

  async getCategories(filters: ReportFilters = {}): Promise<ReportSummary> {
    const res = await apiClient.get<ApiEnvelope<ReportSummary>>(`${this.basePath}/categories`, {
      params: this.buildParams(filters),
    });
    return res.data;
  }

  async getDailySummary(filters: ReportFilters = {}): Promise<ReportSummary> {
    const res = await apiClient.get<ApiEnvelope<ReportSummary>>(`${this.basePath}/daily-summary`, {
      params: this.buildParams(filters),
    });
    return res.data;
  }

  async getSalesTrend(filters: ReportFilters & { groupBy?: 'day' | 'week' | 'month' } = {}): Promise<SalesTrendData> {
    const params = this.buildParams(filters);
    if (filters.groupBy) params.groupBy = filters.groupBy;
    const res = await apiClient.get<ApiEnvelope<{ series: SalesSeriesRow[] }>>(`${this.basePath}/sales`, {
      params,
    });
    return { series: res.data.series || [], dateGrouping: (filters.groupBy as 'day' | 'week' | 'month') || 'day' };
  }
}

export const reportService = new ReportService();
export { ReportService };