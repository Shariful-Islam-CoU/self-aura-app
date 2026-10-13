/**
 * Categories feature types.
 *
 * Mirrors the backend contract exactly as verified against
 * `self_aura_backend`:
 *   - `types/product.ts` -> `CategoryResponse` / `CategoryThumbnailResponse` /
 *     `CategoryBannerResponse`
 *   - `validators/categoryValidators.ts` (create/update field rules)
 *   - `routes/category.routes.ts` (media endpoints)
 *
 * A category is: id, name, slug, optional description, one optional thumbnail,
 * one optional banner, an `isActive` flag and timestamps. There is NO search/
 * filter/sort/pagination endpoint, no product count and no publishing or
 * ordering field on the backend, so none are modeled here - the codebase rule
 * is to only type what the API actually returns.
 */

/** The single optional category image (thumbnail or banner). */
export interface CategoryImage {
  url: string;
  publicId?: string;
  alt?: string;
  /** `true` when stored by the media library, `false` for legacy external URLs. */
  managed: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail: CategoryImage | null;
  banner: CategoryImage | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** `POST /categories` - only `name`/`description` exist on create (slug is server-generated). */
export interface CreateCategoryInput {
  name: string;
  description?: string;
}

/**
 * `PATCH /categories/:id` - at least one field; `isActive` is an
 * update-only flag (deactivation is the backend's soft delete) and
 * `thumbnailAlt`/`bannerAlt` edit an existing image's description
 * without touching any bytes.
 */
export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  thumbnailAlt?: string;
  bannerAlt?: string;
}

/** A local image picked for upload (RN FormData file reference). */
export interface PickedCategoryImage {
  uri: string;
  /** Preferred filename (falls back to a stable name when unknown). */
  name: string;
  /** MIME type - `image/jpeg`, `image/png` or `image/webp` when known. */
  type: string;
  /** Size in bytes, when the picker reports it. */
  size?: number;
}
