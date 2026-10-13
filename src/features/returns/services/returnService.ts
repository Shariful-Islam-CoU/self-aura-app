import { apiClient, type ApiEnvelope } from '@/api';

import type {
  CreateReturnData,
  Return,
  ReturnListData,
  ReturnListParams,
  RejectReturnData,
  UpdateReturnData,
} from '../types';

interface ReturnData {
  return: Return;
}

class ReturnService {
  private readonly basePath = '/returns';

  async list(params: ReturnListParams = {}): Promise<ReturnListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      courier: params.courier || undefined,
      customer: params.customer || undefined,
      status: params.status || undefined,
      refundStatus: params.refundStatus || undefined,
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      sortBy: params.sortBy ?? 'createdAt',
      sortOrder: params.sortOrder ?? 'desc',
    };
    const response = await apiClient.get<ApiEnvelope<ReturnListData>>(this.basePath, { params: query });
    return response.data;
  }

  async getById(id: string): Promise<Return> {
    const response = await apiClient.get<ApiEnvelope<ReturnData>>(`${this.basePath}/${id}`);
    return response.data.return;
  }

  async create(input: CreateReturnData): Promise<Return> {
    const response = await apiClient.post<ApiEnvelope<ReturnData>>(this.basePath, input);
    return response.data.return;
  }

  async update(id: string, input: UpdateReturnData): Promise<Return> {
    const response = await apiClient.patch<ApiEnvelope<ReturnData>>(`${this.basePath}/${id}`, input);
    return response.data.return;
  }

  async approve(id: string): Promise<Return> {
    const response = await apiClient.post<ApiEnvelope<ReturnData>>(`${this.basePath}/${id}/approve`, null);
    return response.data.return;
  }

  async reject(id: string, input: RejectReturnData): Promise<Return> {
    const response = await apiClient.post<ApiEnvelope<ReturnData>>(`${this.basePath}/${id}/reject`, input);
    return response.data.return;
  }

  async receive(id: string): Promise<Return> {
    const response = await apiClient.post<ApiEnvelope<ReturnData>>(`${this.basePath}/${id}/receive`, null);
    return response.data.return;
  }

  async cancel(id: string): Promise<Return> {
    const response = await apiClient.post<ApiEnvelope<ReturnData>>(`${this.basePath}/${id}/cancel`, null);
    return response.data.return;
  }
}

export const returnService = new ReturnService();
export { ReturnService };