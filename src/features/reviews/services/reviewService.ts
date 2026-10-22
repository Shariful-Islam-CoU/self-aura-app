import { apiClient, type ApiEnvelope } from '@/api';

import type {
  CreateReviewInput,
  ModerateReviewInput,
  ProductReviewSummaryResponse,
  PublicReview,
  ReplyInput,
  Review,
  ReviewListData,
  ReviewListParams,
  ReviewReply,
  UpdateReviewInput,
} from '../types';

/**
 * Review service.
 *
 * The backend's response envelope is `{ success, message, data }` and each
 * endpoint's `data` IS the resource (or a `{ items, pagination }` page) - it is
 * NOT wrapped in `{ review: ... }`. Every method below unwraps `response.data`
 * directly; an earlier revision read `response.data.review`, so every call
 * returned `undefined`.
 *
 * Paths are relative to the API base (which already ends in `/api`).
 */

interface ReviewListResponse {
  items: Review[];
  pagination: ReviewListData['pagination'];
}

/** Public product-review list payload (same page shape, public review rows). */
export interface PublicReviewListResponse {
  items: PublicReview[];
  pagination: ReviewListData['pagination'];
}

class ReviewService {
  private readonly managementPath = '/management/reviews';
  private readonly customerPath = '/customer/reviews';

  /* ---------------------------------------------------------------------- */
  /* Management: moderation queue                                           */
  /* ---------------------------------------------------------------------- */

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
    const response = await apiClient.get<ApiEnvelope<ReviewListResponse>>(this.managementPath, {
      params: query,
    });
    return { reviews: response.data.items, pagination: response.data.pagination };
  }

  async getById(id: string): Promise<Review> {
    const response = await apiClient.get<ApiEnvelope<Review>>(`${this.managementPath}/${id}`);
    return response.data;
  }

  async moderate(id: string, input: ModerateReviewInput): Promise<Review> {
    const response = await apiClient.patch<ApiEnvelope<Review>>(
      `${this.managementPath}/${id}/moderate`,
      input,
    );
    return response.data;
  }

  /** Delete any review (management). Requires `reviews.delete`. */
  async remove(id: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`${this.managementPath}/${id}`);
  }

  /* ---------------------------------------------------------------------- */
  /* Management: replies                                                    */
  /* ---------------------------------------------------------------------- */

  async addManagementReply(id: string, input: ReplyInput): Promise<ReviewReply> {
    const response = await apiClient.post<ApiEnvelope<ReviewReply>>(
      `${this.managementPath}/${id}/replies`,
      input,
    );
    return response.data;
  }

  async updateManagementReply(id: string, replyId: string, input: ReplyInput): Promise<ReviewReply> {
    const response = await apiClient.patch<ApiEnvelope<ReviewReply>>(
      `${this.managementPath}/${id}/replies/${replyId}`,
      input,
    );
    return response.data;
  }

  async deleteManagementReply(id: string, replyId: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`${this.managementPath}/${id}/replies/${replyId}`);
  }

  /* ---------------------------------------------------------------------- */
  /* Customer: own review                                                   */
  /* ---------------------------------------------------------------------- */

  async create(input: CreateReviewInput): Promise<PublicReview> {
    const response = await apiClient.post<ApiEnvelope<PublicReview>>(this.customerPath, input);
    return response.data;
  }

  async update(id: string, input: UpdateReviewInput): Promise<PublicReview> {
    const response = await apiClient.patch<ApiEnvelope<PublicReview>>(
      `${this.customerPath}/${id}`,
      input,
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`${this.customerPath}/${id}`);
  }

  /* ---------------------------------------------------------------------- */
  /* Customer: replies                                                      */
  /* ---------------------------------------------------------------------- */

  async addReply(id: string, input: ReplyInput): Promise<ReviewReply> {
    const response = await apiClient.post<ApiEnvelope<ReviewReply>>(
      `${this.customerPath}/${id}/replies`,
      input,
    );
    return response.data;
  }

  async updateReply(id: string, replyId: string, input: ReplyInput): Promise<ReviewReply> {
    const response = await apiClient.patch<ApiEnvelope<ReviewReply>>(
      `${this.customerPath}/${id}/replies/${replyId}`,
      input,
    );
    return response.data;
  }

  async deleteReply(id: string, replyId: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<null>>(`${this.customerPath}/${id}/replies/${replyId}`);
  }

  /* ---------------------------------------------------------------------- */
  /* Public: product reads                                                  */
  /* ---------------------------------------------------------------------- */

  /** Public list of approved reviews for a product (guests allowed). */
  async listProductReviews(
    productId: string,
    params: { page?: number; limit?: number; sortBy?: 'recent' | 'highest' | 'lowest' } = {},
  ): Promise<PublicReviewListResponse> {
    const query: Record<string, string | number | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      sortBy: params.sortBy,
    };
    const response = await apiClient.get<ApiEnvelope<PublicReviewListResponse>>(
      `/catalogue/products/${productId}/reviews`,
      { params: query },
    );
    return response.data;
  }

  async getProductSummary(productId: string): Promise<ProductReviewSummaryResponse> {
    const response = await apiClient.get<ApiEnvelope<ProductReviewSummaryResponse>>(
      `/catalogue/products/${productId}/reviews/summary`,
    );
    return response.data;
  }
}

export const reviewService = new ReviewService();
export { ReviewService };
