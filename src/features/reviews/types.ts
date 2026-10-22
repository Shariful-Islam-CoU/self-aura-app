/**
 * Review types mirroring the backend Review API contract exactly
 * (models/Review.ts + validators/reviewValidators.ts + utils/*ReviewMappers.ts).
 * Nothing is invented.
 *
 * Backend surface (routes/review.routes.ts), paths relative to `/api`:
 *   PUBLIC (optional customer auth; approved reviews only):
 *     GET    /catalogue/products/:productId/reviews          list, paginated
 *     GET    /catalogue/products/:productId/reviews/summary  aggregate rating
 *     GET    /catalogue/reviews/:id                          single approved
 *   CUSTOMER (authenticateCustomer):
 *     POST   /customer/reviews                               create (verified purchase)
 *     PATCH  /customer/reviews/:id                           update own (re-moderation)
 *     DELETE /customer/reviews/:id                           delete own
 *     POST   /customer/reviews/:id/images                    upload images
 *     DELETE /customer/reviews/:id/images/:publicId          delete image
 *     POST   /customer/reviews/:id/replies                   reply to own review
 *     PATCH  /customer/reviews/:id/replies/:replyId          update own reply
 *     DELETE /customer/reviews/:id/replies/:replyId          delete own reply
 *   MANAGEMENT (authenticate + requirePermission):
 *     GET    /management/reviews           list for moderation (requires reviews.view)
 *     GET    /management/reviews/:id       single, any status (requires reviews.view)
 *     PATCH  /management/reviews/:id/moderate approve/reject (requires reviews.approve
 *                                              OR reviews.reject; pending only)
 *     DELETE /management/reviews/:id       delete any review (requires reviews.delete)
 *     POST   /management/reviews/:id/replies            add reply (reviews.reply)
 *     PATCH  /management/reviews/:id/replies/:replyId   update reply (reviews.reply)
 *     DELETE /management/reviews/:id/replies/:replyId   delete reply (reviews.reply)
 *
 * Status flow: pending -> approved | rejected. There is no 'deleted' state;
 * a deleted review is removed outright.
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
  slug?: string;
}

/**
 * Reviewer reference on the MANAGEMENT surface.
 *
 * The public surface never sends a customer ref at all (only a privacy-safe
 * masked display name) - see `PublicReview`. This management ref carries the
 * real account name, which is legitimate for moderation.
 */
export interface ReviewCustomerRef {
  id: string;
  name?: string;
}

export interface ReviewOrderRef {
  id: string;
}

export type ReviewAuthorType = 'customer' | 'admin';

/** A reply on a review (public and management shapes share this contract). */
export interface ReviewReply {
  id: string;
  authorType: ReviewAuthorType;
  /** Privacy-safe label; admin replies read "Self Aura Team". */
  authorName: string;
  text: string;
  createdAt?: string;
  updatedAt?: string;
}

/** MANAGEMENT review shape (GET /management/reviews, /:id, /moderate). */
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
  replies: ReviewReply[];
  status: ReviewStatus;
  /** Internal-only. Returned solely on the authenticated management surface. */
  moderationNote?: string;
  createdAt: string;
  updatedAt: string;
}

/** PUBLIC review shape (catalogue reads). No ids, no status, no moderationNote. */
export interface PublicReview {
  id: string;
  product: ReviewProductRef;
  rating: number;
  title?: string;
  comment: string;
  author: { displayName: string };
  isVerifiedPurchase: boolean;
  isOwnReview: boolean;
  images: ReviewImage[];
  replies: ReviewReply[];
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
  /** Null when the product has no reviews yet (never a fabricated 0). */
  averageRating: number | null;
  reviewCount: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
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

/** POST/PATCH reply request body (customer and management share it). */
export interface ReplyInput {
  text: string;
}
