import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { reviewService } from './services/reviewService';
import type {
  CreateReviewInput,
  ModerateReviewInput,
  Review,
  ReviewListParams,
  UpdateReviewInput,
} from './types';

export const REVIEWS_PAGE_SIZE = 20;

export const reviewsKeys = {
  all: ['reviews'] as const,
  list: (params: ReviewListParams) => ['reviews', 'list', params] as const,
  detail: (id: string) => ['reviews', 'detail', id] as const,
  productReviews: (productId: string, params: { page?: number; limit?: number; sortBy?: 'recent' | 'highest' | 'lowest' }) => ['reviews', 'product', productId, params] as const,
  productSummary: (productId: string) => ['reviews', 'product', productId, 'summary'] as const,
};

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
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

export function useReviewDetails(reviewId: string | undefined) {
  const id = reviewId ?? '';
  return useQuery({
    queryKey: ['reviews', 'detail', id],
    queryFn: () => reviewService.getById(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useProductReviews(productId: string | undefined, params: { page?: number; limit?: number; sortBy?: 'recent' | 'highest' | 'lowest' } = {}) {
  const id = productId ?? '';
  return useQuery({
    queryKey: ['reviews', 'product', id, params],
    queryFn: () => reviewService.list({ ...params, productId: id }),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useProductReviewSummary(productId: string | undefined) {
  const id = productId ?? '';
  return useQuery({
    queryKey: ['reviews', 'product', id, 'summary'],
    queryFn: () => reviewService.getProductSummary(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

function useReviewMutation<TVars>(mutationFn: (vars: TVars) => Promise<Review>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (review) => {
      queryClient.setQueryData(['reviews', 'detail', review.id], review);
      void queryClient.invalidateQueries({ queryKey: ['reviews', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['reviews', 'product'] });
    },
  });
}

export function useCreateReview() {
  return useReviewMutation<CreateReviewInput>((input: CreateReviewInput) => reviewService.create(input));
}

export function useUpdateReview(id: string) {
  return useReviewMutation<UpdateReviewInput>((input: UpdateReviewInput) => reviewService.update(id, input));
}

export function useDeleteReview(id: string) {
  return useReviewMutation<void>(() => reviewService.delete(id));
}

export function useModerateReview(id: string) {
  return useReviewMutation<ModerateReviewInput>((input: ModerateReviewInput) => reviewService.moderate(id, input));
}