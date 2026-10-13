/**
 * Products feature types.
 *
 * Mirrors the backend contract exactly as verified against
 * `self_aura_backend`:
 *   - `types/product.ts` -> `ProductResponse` / `ProductListData` /
 *     `ProductCategoryRef` / `ProductVariantResponse`
 *   - `types/productImage.ts` -> `ManagedProductImageResponse` /
 *     `ManagedProductVideoResponse`
 *   - `validators/productValidators.ts` (create/update field rules)
 *   - `routes/product.routes.ts` + `routes/productMedia.routes.ts`
 *     (endpoints + query params)
 *
 * The management product response embeds the MANAGED image/video lists (each
 * entry carries the `key` the media endpoints address an asset by), so the
 * detail screen and the media managers share one source - the same contract
 * the web app reads. There is no `status` enum, no `published`, no
 * attributes/tags and no price-margin rule: `isActive` is the only status
 * dimension, and `stock`/`lowStockThreshold` live on the product (their
 * transaction history is owned by the inventory module, never edited here).
 */

/** `ManagedProductImageResponse` - one ordered product image. */
export interface ProductImage {
  url: string;
  alt: string;
  /** Zero-based display order; index 0 is the primary image. */
  sortOrder: number;
  /** Stable handle the media endpoints address the asset by. */
  key: string;
  /** Present only for a managed asset; the durable delete handle. */
  publicId?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  /** True when this deployment owns the file and can delete it physically. */
  managed: boolean;
}

/** `ManagedProductVideoResponse` - one ordered product video. */
export interface ProductVideo {
  url: string;
  sortOrder: number;
  thumbnailUrl?: string;
  alt?: string;
  key: string;
  publicId?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  /** Seconds. Rendered as a length badge. */
  duration?: number;
  managed: boolean;
}

/** `ProductCategoryRef` - the populated category on every product read. */
export interface ProductCategoryRef {
  id: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
}

/** `ProductVariantResponse` - variants exist only when the backend returns them. */
export interface ProductVariant {
  id: string;
  name: string;
  options: { name: string; value: string }[];
  sku?: string;
  costPrice?: number;
  sellingPrice?: number;
  stock?: number;
}

/** `ProductResponse` from `self_aura_backend/src/types/product.ts`. */
export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  category: ProductCategoryRef;
  images: ProductImage[];
  videos: ProductVideo[];
  costPrice: number;
  sellingPrice: number;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** `ProductListData` - what `GET /products` returns under `data` (offset pagination). */
export interface ProductListData {
  items: Product[];
  pagination: ProductPagination;
}

/** Sort keys accepted by the backend's `productListQuerySchema`. */
export type ProductSortBy = 'createdAt' | 'name' | 'sellingPrice' | 'stock';
export type SortOrder = 'asc' | 'desc';

/** Query parameters supported by `GET /products` (validated backend-side). */
export interface ProductListParams {
  page?: number;
  limit?: number;
  /** Server-side match on name, SKU or description (backend regex, case-insensitive). */
  search?: string;
  /** Category object id (24-hex). */
  category?: string;
  /** `true` = active only, `false` = inactive only, omitted = all. */
  isActive?: boolean;
  /** `true` = stock <= lowStockThreshold. Deliberately NOT used by this module's UI (web parity). */
  lowStock?: boolean;
  sortBy?: ProductSortBy;
  sortOrder?: SortOrder;
}

/** Ready-made filter/sort state shared between the list UI and query key. */
export interface ProductListFilters {
  category?: string;
  isActive?: boolean;
  sortBy: ProductSortBy;
  sortOrder: SortOrder;
}

/**
 * `POST /products` (`createProductSchema`). Stock/lowStockThreshold default
 * server-side and are deliberately not form fields - exactly like the web
 * form, which only sends name, SKU, category, description and the prices.
 */
export interface CreateProductInput {
  name: string;
  sku: string;
  category: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
}

/** `PATCH /products/:id` - at least one field; `isActive` is edit-only. */
export interface UpdateProductInput {
  name?: string;
  sku?: string;
  category?: string;
  description?: string;
  costPrice?: number;
  sellingPrice?: number;
  isActive?: boolean;
}

/**
 * A local media file picked for upload (RN FormData file reference) - the
 * shape the same as the category picker; both upload through the backend's
 * media API, never a third party.
 */
export interface PickedMediaFile {
  uri: string;
  /** Preferred filename (falls back to a stable name when unknown). */
  name: string;
  /** MIME type - one of the accepted image/video types when known. */
  type: string;
  /** Size in bytes, when the picker reports it. */
  size?: number;
}

/** `PUT /products/:id/images/order` body - the submitted list IS the new list. */
export interface ManagedImageInput {
  key: string;
  /** Optional re-title; omitted entries keep their stored alt. */
  alt?: string;
}

/** `PUT /products/:id/videos/order` body - same semantics as images. */
export interface ManagedVideoInput {
  key: string;
  alt?: string;
}

/** Media endpoint responses: the full managed list, plus the upload payload. */
export interface ProductImagesData {
  images: ProductImage[];
  image?: ProductImage;
}

export interface ProductVideosData {
  videos: ProductVideo[];
  video?: ProductVideo;
}
