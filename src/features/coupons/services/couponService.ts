import { apiClient, type ApiEnvelope } from '@/api';

import type {
  CreateCouponInput,
  Coupon,
  CouponListData,
  CouponListParams,
  ToggleCouponStatusInput,
  UpdateCouponInput,
} from '../types';

interface CouponData {
  coupon: Coupon;
}

class CouponService {
  private readonly basePath = '/management/coupons';

  async list(params: CouponListParams = {}): Promise<CouponListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      isActive: params.isActive,
      type: params.type,
      status: params.status,
      sortBy: params.sortBy ?? 'createdAt',
      sortOrder: params.sortOrder ?? 'desc',
    };
    const response = await apiClient.get<ApiEnvelope<CouponListData>>(this.basePath, { params: query });
    return response.data;
  }

  async getById(id: string): Promise<Coupon> {
    const response = await apiClient.get<ApiEnvelope<CouponData>>(`${this.basePath}/${id}`);
    return response.data.coupon;
  }

  async create(input: CreateCouponInput): Promise<Coupon> {
    const response = await apiClient.post<ApiEnvelope<CouponData>>(this.basePath, input);
    return response.data.coupon;
  }

  async update(id: string, input: UpdateCouponInput): Promise<Coupon> {
    const response = await apiClient.patch<ApiEnvelope<CouponData>>(`${this.basePath}/${id}`, input);
    return response.data.coupon;
  }

  async delete(id: string): Promise<Coupon> {
    const response = await apiClient.delete<ApiEnvelope<CouponData>>(`${this.basePath}/${id}`);
    return response.data.coupon;
  }

  async toggleStatus(id: string, input: ToggleCouponStatusInput): Promise<Coupon> {
    const response = await apiClient.patch<ApiEnvelope<CouponData>>(`${this.basePath}/${id}/toggle`, input);
    return response.data.coupon;
  }
}

export const couponService = new CouponService();
export { CouponService };