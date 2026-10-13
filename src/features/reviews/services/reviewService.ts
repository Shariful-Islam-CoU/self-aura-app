import { apiClient, type ApiEnvelope } from '@/api';

import type {
  CreateReviewInput,
  ModerateReviewInput,
  Review,
  ReviewListData,
  ReviewListParams,
  UpdateReviewInput,
} from '../types';


interface ReviewListResponse {
  items: Review[];
  pagination: ReviewListData['pagination'];
}

class ReviewService {
  private readonly basePath = '/management/reviews';

  async list(params: ReviewListParams = {}): Promise<ReviewListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      status: params.status,
      rating: params.rating,
      productId: params.productId,
      customerId: params.customerId,
      sortBy: params.sortBy ?? 'recent',
    };
    const response = await apiClient.get<ApiEnvelope<ReviewListResponse>>(this.basePath, { params: query });
    return { reviews: response.data.items, pagination: response.data.pagination };
  }

  async getById(id: string): Promise<Review> {
    const response = await apiClient.get<ApiEnvelope<{ review: Review }>>(`${this.basePath}/${id}`);
    return response.data.review;
  }

  async create(input: CreateReviewInput): Promise<Review> {
    const response = await apiClient.post<ApiEnvelope<{ review: Review }>>('/customer/reviews', input);
    return response.data.review;
  }

  async update(id: string, input: UpdateReviewInput): Promise<Review> {
    const response = await apiClient.patch<ApiEnvelope<{ review: Review }>>(`/customer/reviews/${id}`, input);
    return response.data.review;
  }

  async delete(id: string): Promise<Review> {
    const response = await apiClient.delete<ApiEnvelope<{ review: Review }>>(`/customer/reviews/${id}`);
    return response.data.review;
  }

  async moderate(id: string, input: ModerateReviewInput): Promise<Review> {
    const response = await apiClient.patch<ApiEnvelope<{ review: Review }>>(`${this.basePath}/${id}/moderate`, input);
    return response.data.review;
  }

  async getProductSummary(productId: string): Promise<{ averageRating?: number; reviewCount: number; distribution?: Partial<Record<1 | 2 | 3 | 4 | 5, number>> }> {
    const response = await apiClient.get<ApiEnvelope<{ averageRating?: number; reviewCount: number; distribution?: Partial<Record<1 | 2 | 3 | 4 | 5, number>> }>>(`/catalogue/products/${productId}/reviews/summary`);
    return response.data;
  }
}

export const reviewService = new ReviewService();
export { ReviewService };