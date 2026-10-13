import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { categoryService } from './services/categoryService';
import type { CreateCategoryInput, PickedCategoryImage, UpdateCategoryInput } from './types';

/**
 * Query keys. Everything category-related lives under 'categories' so a
 * mutation can invalidate the whole group with a prefix match. The list has
 * no parameters (the backend returns the full alphabetical list - there is
 * no search/filter/sort/pagination), so it is a stable key; the detail key
 * carries the id. Media mutations invalidate both detail and list because a
 * thumbnail change is visible in the list cards and the detail screen.
 */
export const categoriesKeys = {
  all: ['categories'] as const,
  list: () => ['categories', 'list'] as const,
  detail: (id: string) => ['categories', 'detail', id] as const,
};

/** Refetches the list and the detail for `id` after any category mutation. */
function refreshCategory(queryClient: QueryClient, id: string): void {
  void queryClient.invalidateQueries({ queryKey: categoriesKeys.detail(id) });
  void queryClient.invalidateQueries({ queryKey: categoriesKeys.list() });
}

/** Full category list (backed by `GET /categories` - always alphabetical). */
export function useCategoriesList() {
  return useQuery({
    queryKey: categoriesKeys.list(),
    queryFn: () => categoryService.list(),
    staleTime: 30_000,
  });
}

/** Authoritative category detail - fetched by ID only, never passed around. */
export function useCategoryDetails(categoryId: string | undefined) {
  const id = categoryId ?? '';
  return useQuery({
    queryKey: categoriesKeys.detail(id),
    queryFn: () => categoryService.getById(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoryService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoriesKeys.list() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      categoryService.update(id, input),
    onSuccess: (_data, { id }) => {
      refreshCategory(queryClient, id);
    },
  });
}

/** Soft delete - the backend deactivates the category (isActive = false). */
export function useDeactivateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryService.deactivate(id),
    onSuccess: (_data, id) => {
      refreshCategory(queryClient, id);
    },
  });
}

// ---------------------------------------------------------------------------
// Media mutations - each bound to one category (the screen owns the id).
// ---------------------------------------------------------------------------

export function useUploadCategoryThumbnail(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ image, alt }: { image: PickedCategoryImage; alt?: string }) =>
      categoryService.uploadThumbnail(categoryId, image, alt),
    onSuccess: () => {
      refreshCategory(queryClient, categoryId);
    },
  });
}

export function useRemoveCategoryThumbnail(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => categoryService.removeThumbnail(categoryId),
    onSuccess: () => {
      refreshCategory(queryClient, categoryId);
    },
  });
}

export function useUploadCategoryBanner(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ image, alt }: { image: PickedCategoryImage; alt?: string }) =>
      categoryService.uploadBanner(categoryId, image, alt),
    onSuccess: () => {
      refreshCategory(queryClient, categoryId);
    },
  });
}

export function useRemoveCategoryBanner(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => categoryService.removeBanner(categoryId),
    onSuccess: () => {
      refreshCategory(queryClient, categoryId);
    },
  });
}
