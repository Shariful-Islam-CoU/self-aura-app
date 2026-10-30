import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dashboardKeys } from '@/features/dashboard/queries';
import { inventoryKeys } from '@/features/inventory/keys';
import { productService } from './services/productService';
import type {
  CreateProductInput,
  ManagedImageInput,
  ManagedVideoInput,
  PickedMediaFile,
  Product,
  ProductImagesData,
  ProductListFilters,
  ProductVideosData,
  UpdateProductInput,
} from './types';

/** Backend caps `limit` at 100; 20 matches the backend default page size. */
export const PRODUCTS_PAGE_SIZE = 20;

/**
 * Query keys. Everything product-related lives under 'products' so a
 * mutation can invalidate the whole group with a prefix match, and each
 * sub-key carries the state that changes its response (filters/search/id)
 * for automatic dedupe.
 */
export const productsKeys = {
  all: ['products'] as const,
  list: (filters: ProductListFilters, search: string) =>
    ['products', 'list', search, filters] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
};

/**
 * Paginated product list (page N + filters + debounced search in the key).
 * `placeholderData` keeps the current page on screen while a filter/search
 * change loads; pull-to-refresh calls `refetch()` which reloads the loaded
 * pages with the same key (filters are preserved because they are part of
 * the key).
 */
export function useProductsInfinite(filters: ProductListFilters, search: string) {
  return useInfiniteQuery({
    queryKey: productsKeys.list(filters, search),
    queryFn: ({ pageParam }) =>
      productService.list({
        page: pageParam,
        limit: PRODUCTS_PAGE_SIZE,
        search: search || undefined,
        category: filters.category,
        isActive: filters.isActive,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: (previous) => previous,
  });
}

/** Authoritative product detail - fetched by ID only, never passed around. */
export function useProductDetails(productId: string | undefined) {
  const id = productId ?? '';
  return useQuery({
    queryKey: productsKeys.detail(id),
    queryFn: () => productService.getById(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

/**
 * Create/update/deactivate share one behavior: the server returns the
 * updated product, so the detail cache is set from that authoritative
 * response immediately (no optimistic guessing), then the whole product
 * group, the dashboard (low-stock section) and the inventory group
 * (catalogue totals shown on the products list) are invalidated so every
 * screen converges on the same state. Failures surface through `error` -
 * never faked.
 */
function useProductMutation<TVars>(mutationFn: (vars: TVars) => Promise<Product>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (product) => {
      queryClient.setQueryData(productsKeys.detail(product.id), product);
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useCreateProduct() {
  return useProductMutation<CreateProductInput>((input) => productService.create(input));
}

export function useUpdateProduct() {
  return useProductMutation<{ id: string; input: UpdateProductInput }>(({ id, input }) =>
    productService.update(id, input),
  );
}

export function useDeactivateProduct() {
  return useProductMutation<{ id: string }>(({ id }) => productService.deactivate(id));
}

// ---------------------------------------------------------------------------
// Media mutations
//
// Every media endpoint is keyed by product id (the hook owns the id so the
// success handler can patch the right detail cache). The server always
// returns the FULL managed list, which replaces the product's embedded list
// in the cache immediately - no optimistic guessing, no re-assembly - and
// the product list group is invalidated so cards (primary image, etc.)
// converge too. The dashboard is untouched: media never changes stock.
// ---------------------------------------------------------------------------

function useProductImagesMutation<TVars>(
  productId: string,
  mutationFn: (vars: TVars) => Promise<ProductImagesData>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      queryClient.setQueryData(productsKeys.detail(productId), (old: Product | undefined) =>
        old ? { ...old, images: data.images } : old,
      );
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
}

function useProductVideosMutation<TVars>(
  productId: string,
  mutationFn: (vars: TVars) => Promise<ProductVideosData>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      queryClient.setQueryData(productsKeys.detail(productId), (old: Product | undefined) =>
        old ? { ...old, videos: data.videos } : old,
      );
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
}

export function useUploadProductImage(productId: string) {
  return useProductImagesMutation<{ file: PickedMediaFile }>(productId, ({ file }) =>
    productService.uploadImage(productId, file),
  );
}

export function useUpdateProductImages(productId: string) {
  return useProductImagesMutation<{ images: ManagedImageInput[] }>(productId, ({ images }) =>
    productService.updateImagesOrder(productId, images),
  );
}

export function useUploadProductVideo(productId: string) {
  return useProductVideosMutation<{ file: PickedMediaFile }>(productId, ({ file }) =>
    productService.uploadVideo(productId, file),
  );
}

export function useUpdateProductVideos(productId: string) {
  return useProductVideosMutation<{ videos: ManagedVideoInput[] }>(productId, ({ videos }) =>
    productService.updateVideosOrder(productId, videos),
  );
}
