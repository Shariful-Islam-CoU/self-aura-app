import { apiClient, type ApiEnvelope } from '@/api';

import type {
  Courier,
  CourierListData,
  CourierListParams,
  CreateCourierData,
  UpdateCourierData,
} from '../types';

interface CourierData {
  courier: Courier;
}

class CourierService {
  private readonly basePath = '/couriers';

  async list(params: CourierListParams = {}): Promise<CourierListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search || undefined,
      isActive: params.isActive,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };
    const response = await apiClient.get<ApiEnvelope<CourierListData>>(this.basePath, { params: query });
    return response.data;
  }

  async getById(id: string): Promise<Courier> {
    const response = await apiClient.get<ApiEnvelope<CourierData>>(`${this.basePath}/${id}`);
    return response.data.courier;
  }

  async create(input: CreateCourierData): Promise<Courier> {
    const response = await apiClient.post<ApiEnvelope<CourierData>>(this.basePath, input);
    return response.data.courier;
  }

  async update(id: string, input: UpdateCourierData): Promise<Courier> {
    const response = await apiClient.patch<ApiEnvelope<CourierData>>(`${this.basePath}/${id}`, input);
    return response.data.courier;
  }

  async deactivate(id: string): Promise<Courier> {
    const response = await apiClient.delete<ApiEnvelope<CourierData>>(`${this.basePath}/${id}`);
    return response.data.courier;
  }
}

export const courierService = new CourierService();
export { CourierService };



