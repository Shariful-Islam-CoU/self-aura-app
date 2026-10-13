import { apiClient, type ApiEnvelope } from '@/api';

import type {
  CreateShipmentData,
  Shipment,
  ShipmentEvent,
  ShipmentListData,
  ShipmentListParams,
  UpdateShipmentData,
  UpdateShipmentStatusData,
} from '../types';

class ShipmentService {
  private readonly basePath = '/shipments';

  async list(params: ShipmentListParams = {}): Promise<ShipmentListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search || undefined,
      courier: params.courier || undefined,
      customer: params.customer || undefined,
      status: params.status || undefined,
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      shippedFrom: params.shippedFrom || undefined,
      shippedTo: params.shippedTo || undefined,
      deliveredFrom: params.deliveredFrom || undefined,
      deliveredTo: params.deliveredTo || undefined,
      sortBy: params.sortBy ?? 'createdAt',
      sortOrder: params.sortOrder ?? 'desc',
    };
    const response = await apiClient.get<ApiEnvelope<ShipmentListData>>(this.basePath, {
      params: query,
    });
    return response.data;
  }

  async getById(id: string): Promise<Shipment> {
    const response = await apiClient.get<ApiEnvelope<{ shipment: Shipment }>>(
      `${this.basePath}/${id}`,
    );
    return response.data.shipment;
  }

  async create(input: CreateShipmentData): Promise<Shipment> {
    const response = await apiClient.post<ApiEnvelope<{ shipment: Shipment }>>(
      this.basePath,
      input,
    );
    return response.data.shipment;
  }

  async update(id: string, input: UpdateShipmentData): Promise<Shipment> {
    const response = await apiClient.patch<ApiEnvelope<{ shipment: Shipment }>>(
      `${this.basePath}/${id}`,
      input,
    );
    return response.data.shipment;
  }

  async updateStatus(id: string, input: UpdateShipmentStatusData): Promise<Shipment> {
    const response = await apiClient.patch<ApiEnvelope<{ shipment: Shipment }>>(
      `${this.basePath}/${id}/status`,
      input,
    );
    return response.data.shipment;
  }

  async cancel(id: string): Promise<Shipment> {
    const response = await apiClient.post<ApiEnvelope<{ shipment: Shipment }>>(
      `${this.basePath}/${id}/cancel`,
      null,
    );
    return response.data.shipment;
  }

  async getHistory(id: string): Promise<ShipmentEvent[]> {
    const response = await apiClient.get<ApiEnvelope<{ history: ShipmentEvent[] }>>(
      `${this.basePath}/${id}/history`,
    );
    return response.data.history;
  }
}

export const shipmentService = new ShipmentService();
export { ShipmentService };
