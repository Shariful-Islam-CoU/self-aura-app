import { apiClient, type ApiEnvelope } from '@/api';

import type {
  CreateDeliveryRuleInput,
  DeliveryRule,
  DeliveryRuleListData,
  DeliveryRuleListParams,
  ToggleDeliveryRuleStatusInput,
  UpdateDeliveryRuleInput,
} from '../types';

interface DeliveryRuleData {
  rule: DeliveryRule;
}

/**
 * Delivery-rule API client. Every call hits the real backend management
 * endpoints (`routes/deliveryRule.routes.ts`); nothing is mocked and the
 * backend re-validates every request.
 */
class DeliveryRuleService {
  private readonly basePath = '/delivery-rules/management/delivery-rules';

  async list(params: DeliveryRuleListParams = {}): Promise<DeliveryRuleListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      isActive: params.isActive,
      sortBy: params.sortBy ?? 'sortOrder',
      sortOrder: params.sortOrder ?? 'asc',
    };
    const response = await apiClient.get<ApiEnvelope<DeliveryRuleListData>>(this.basePath, {
      params: query,
    });
    return response.data;
  }

  async getById(id: string): Promise<DeliveryRule> {
    const response = await apiClient.get<ApiEnvelope<DeliveryRuleData>>(`${this.basePath}/${id}`);
    return response.data.rule;
  }

  async create(input: CreateDeliveryRuleInput): Promise<DeliveryRule> {
    const response = await apiClient.post<ApiEnvelope<DeliveryRuleData>>(this.basePath, input);
    return response.data.rule;
  }

  async update(id: string, input: UpdateDeliveryRuleInput): Promise<DeliveryRule> {
    const response = await apiClient.patch<ApiEnvelope<DeliveryRuleData>>(
      `${this.basePath}/${id}`,
      input,
    );
    return response.data.rule;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`${this.basePath}/${id}`);
  }

  async toggle(id: string, input: ToggleDeliveryRuleStatusInput): Promise<DeliveryRule> {
    const response = await apiClient.patch<ApiEnvelope<DeliveryRuleData>>(
      `${this.basePath}/${id}/toggle`,
      input,
    );
    return response.data.rule;
  }
}

export const deliveryRuleService = new DeliveryRuleService();
export { DeliveryRuleService };
