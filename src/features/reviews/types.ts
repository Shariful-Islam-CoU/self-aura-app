/**
 * Review types mirroring the backend Review API contract exactly
 * (models/Review.ts + validators/reviewValidators.ts).
 * Nothing is invented.
 *
 * Backend surface (routes/review.routes.ts):
 *   PUBLIC (no auth):
 *     GET    /catalogue/products/:productId/reviews          list approved (paginated)
 *     GET    /catalogue/products/:productId/reviews/summary  aggregate rating
 *     GET    /catalogue/reviews/:id                          single approved review
 *   CUSTOMER (authenticateCustomer):
 *     POST   /customer/reviews                               create (validated purchase)
 *     PATCH  /customer/reviews/:id                           update own (pending/approved)
 *     DELETE /customer/reviews/:id                           delete own
 *     POST   /customer/reviews/:id/images                    upload images
 *     DELETE /customer/reviews/:id/images/:publicId          delete image
 *   MANAGEMENT (authenticate + requirePermission):
 *     GET    /management/reviews           list for moderation (filter/status/date)
 *     PATCH  /management/reviews/:id/moderate approve/reject (pending only)
 *     Note: No delete endpoint - reviews are never deleted, only moderated.
 *
 * Status flow: pending -> approved | rejected. No 'deleted' state.
 */

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export interface ReviewImage {
  url: string;
  publicId: string;
  sortOrder: number;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface ReviewProductRef {
  id: string;
  name?: string;
}

export interface ReviewCustomerRef {
  id: string;
  name?: string;
  displayName?: string;
}

export interface ReviewOrderRef {
  id: string;
  orderNumber?: string;
}

export interface ReviewActorRef {
  id: string;
  username?: string;
  role?: string;
}

export interface Review {
  id: string;
  product: ReviewProductRef;
  customer: ReviewCustomerRef;
  order: ReviewOrderRef;
  orderItem: string;
  rating: number;
  title?: string;
  comment: string;
  images: ReviewImage[];
  status: ReviewStatus;
  moderationNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReviewListData {
  reviews: Review[];
  pagination: ReviewPagination;
}

export interface ReviewListParams {
  page?: number;
  limit?: number;
  status?: ReviewStatus;
  rating?: number;
  productId?: string;
  customerId?: string;
  sortBy?: 'recent' | 'oldest' | 'highest' | 'lowest';
}

export interface ProductReviewSummaryResponse {
  averageRating?: number;
  reviewCount: number;
  distribution?: Partial<Record<1 | 2 | 3 | 4 | 5, number>>;
}

export interface ProductReviewsDataResponse {
  summary?: ProductReviewSummaryResponse;
  items: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateReviewInput {
  product: string;
  rating: number;
  title?: string;
  comment: string;
}

export type UpdateReviewInput = Partial<Pick<Review, 'rating' | 'title' | 'comment'>>;

export interface ModerateReviewInput {
  status: 'approved' | 'rejected';
  moderationNote?: string;
}