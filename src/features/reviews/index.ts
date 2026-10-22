export type {
  CreateReviewInput,
  ModerateReviewInput,
  ProductReviewSummaryResponse,
  PublicReview,
  ReplyInput,
  Review,
  ReviewAuthorType,
  ReviewCustomerRef,
  ReviewImage,
  ReviewListData,
  ReviewListParams,
  ReviewOrderRef,
  ReviewPagination,
  ReviewProductRef,
  ReviewReply,
  ReviewStatus,
  UpdateReviewInput,
} from './types';
export { REVIEW_STATUSES } from './types';

export {
  REVIEWS_PAGE_SIZE,
  reviewsKeys,
  useAddManagementReply,
  useAddReply,
  useCreateReview,
  useDeleteManagementReply,
  useDeleteOwnReview,
  useDeleteReview,
  useModerateReview,
  useProductReviewSummary,
  useProductReviews,
  useReviewDetails,
  useReviewsInfinite,
  useUpdateManagementReply,
  useUpdateReview,
} from './queries';
export type { PublicReviewListResponse } from './services/reviewService';

export { reviewService, ReviewService } from './services/reviewService';
