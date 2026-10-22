import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { reviewService } from './services/reviewService';
import type {
  CreateReviewInput,
  ModerateReviewInput,
  ProductReviewSummaryResponse,
  PublicReview,
  ReplyInput,
  Review,
  ReviewListData,
  ReviewListParams,
  UpdateReviewInput,
} from './types';

export const REVIEWS_PAGE_SIZE = 20;

export const reviewsKeys = {
  all: ['reviews'] as const,
  list: (params: ReviewListParams) => ['reviews', 'list', params] as const,
  detail: (id: string) => ['reviews', 'detail', id] as const,
  productReviews: (
    productId: string,
    params: { page?: number; limit?: number; sortBy?: 'recent' | 'highest' | 'lowest' },
  ) => ['reviews', 'product', productId, params] as const,
  productSummary: (productId: string) => ['reviews', 'product', productId, 'summary'] as const,
};

/** Management moderation queue, cursor-paged. */
export function useReviewsInfinite(params: ReviewListParams = {}) {
  return useInfiniteQuery({
    queryKey: reviewsKeys.list(params),
    queryFn: ({ pageParam }) =>
      reviewService.list({
        ...params,
        page: pageParam,
        limit: REVIEWS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: ReviewListData) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

export function useReviewDetails(reviewId: string | undefined) {
  const id = reviewId ?? '';
  return useQuery({
    queryKey: reviewsKeys.detail(id),
    queryFn: () => reviewService.getById(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

/**
 * Public product reviews (approved only, guests allowed). This reads the
 * catalogue endpoint, NOT the management queue: a storefront-facing screen must
 * never pull moderation data.
 */
export function useProductReviews(
  productId: string | undefined,
  params: { page?: number; limit?: number; sortBy?: 'recent' | 'highest' | 'lowest' } = {},
) {
  const id = productId ?? '';
  return useQuery({
    queryKey: reviewsKeys.productReviews(id, params),
    queryFn: () => reviewService.listProductReviews(id, params),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useProductReviewSummary(productId: string | undefined) {
  const id = productId ?? '';
  return useQuery<ProductReviewSummaryResponse>({
    queryKey: reviewsKeys.productSummary(id),
    queryFn: () => reviewService.getProductSummary(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

/**
 * Invalidate every review-backed query so a write is reflected everywhere:
 * the moderation list, the single review, and the public product reads.
 */
function useInvalidateReviews() {
  const queryClient = useQueryClient();
  return (review?: { id: string }) => {
    if (review) {
      void queryClient.invalidateQueries({ queryKey: reviewsKeys.detail(review.id) });
    }
    void queryClient.invalidateQueries({ queryKey: ['reviews', 'list'] });
    void queryClient.invalidateQueries({ queryKey: ['reviews', 'product'] });
  };
}

export function useModerateReview(id: string) {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (input: ModerateReviewInput) => reviewService.moderate(id, input),
    onSuccess: (review: Review) => invalidate(review),
  });
}

export function useDeleteReview(id: string) {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: () => reviewService.remove(id),
    onSuccess: () => invalidate(),
  });
}

/* -------------------------------------------------------------------------- */
/* Management replies                                                         */
/* -------------------------------------------------------------------------- */

export function useAddManagementReply(id: string) {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (input: ReplyInput) => reviewService.addManagementReply(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateManagementReply(id: string) {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: ({ replyId, input }: { replyId: string; input: ReplyInput }) =>
      reviewService.updateManagementReply(id, replyId, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteManagementReply(id: string) {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (replyId: string) => reviewService.deleteManagementReply(id, replyId),
    onSuccess: () => invalidate(),
  });
}

/* -------------------------------------------------------------------------- */
/* Customer writes                                                            */
/* -------------------------------------------------------------------------- */

export function useCreateReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => reviewService.create(input),
    onSuccess: (_review: PublicReview) => invalidate(),
  });
}

export function useUpdateReview(id: string) {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (input: UpdateReviewInput) => reviewService.update(id, input),
    onSuccess: () => invalidate(),
  });
}

/** Customer deletes their own review. */
export function useDeleteOwnReview(id: string) {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: () => reviewService.delete(id),
    onSuccess: () => invalidate(),
  });
}

export function useAddReply(id: string) {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (input: ReplyInput) => reviewService.addReply(id, input),
    onSuccess: () => invalidate(),
  });
}
