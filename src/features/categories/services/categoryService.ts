import { apiClient, type ApiEnvelope } from '@/api';
import type {
  Category,
  CreateCategoryInput,
  PickedCategoryImage,
  UpdateCategoryInput,
} from '../types';

/**
 * All category API calls (mirrors `self_aura_frontend`'s categoryService).
 *
 * Endpoints (permission enforced backend-side):
 *   GET    /categories              - all categories, server-sorted by name (categories.view)
 *   GET    /categories/:id          - single category (categories.view)
 *   POST   /categories              - create: name + optional description (categories.create)
 *   PATCH  /categories/:id          - update name/description/isActive/alt texts (categories.edit)
 *   DELETE /categories/:id          - soft delete = deactivate (categories.delete)
 *   POST   /categories/:id/thumbnail - upload or replace the thumbnail (categories.edit)
 *   DELETE /categories/:id/thumbnail - clear thumbnail + delete stored asset (categories.edit)
 *   POST   /categories/:id/banner    - upload or replace the banner (categories.edit)
 *   DELETE /categories/:id/banner    - clear banner + delete stored asset (categories.edit)
 *
 * The backend has no search/filter/sort/pagination on categories (it returns
 * the full alphabetical list), so this service intentionally takes no query
 * params - same as the web app. The category API performs no business math;
 * validation and storage are the backend's responsibility, and the client
 * only mirrors field rules for faster feedback.
 *
 * Media uploads are multipart (`file` + optional `alt` fields) sent through
 * the authenticated API client. The app never holds Cloudinary credentials -
 * the backend owns the provider entirely.
 */
class CategoryService {
  private readonly basePath = '/categories';

  async list(): Promise<Category[]> {
    const res = await apiClient.get<ApiEnvelope<Category[]>>(this.basePath);
    return res.data;
  }

  async getById(id: string): Promise<Category> {
    const res = await apiClient.get<ApiEnvelope<Category>>(`${this.basePath}/${id}`);
    return res.data;
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const res = await apiClient.post<ApiEnvelope<Category>>(this.basePath, input);
    return res.data;
  }

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const res = await apiClient.patch<ApiEnvelope<Category>>(`${this.basePath}/${id}`, input);
    return res.data;
  }

  /** Soft delete - the backend deactivates the category (isActive = false). */
  async deactivate(id: string): Promise<Category> {
    const res = await apiClient.delete<ApiEnvelope<Category>>(`${this.basePath}/${id}`);
    return res.data;
  }

  // ---------------------------------------------------------------------------
  // Media
  //
  // A category has AT MOST ONE thumbnail and AT MOST ONE banner: the upload
  // endpoint replaces in place, the DELETE clears the reference and removes
  // the stored asset. Both are gated by `categories.edit`, the same database-
  // driven permission the category form needs. Every upload returns the whole
  // updated category, so the client never re-assembles state.
  // ---------------------------------------------------------------------------

  private buildMediaFormData(image: PickedCategoryImage, alt?: string): FormData {
    const formData = new FormData();
    // RN FormData file reference: the runtime turns this object into a
    // multipart part with filename + MIME type. Kept as a Blob-typed value
    // because React Native's FormData types accept browser Blobs.
    formData.append('file', {
      uri: image.uri,
      name: image.name,
      type: image.type,
    } as unknown as Blob);
    const trimmedAlt = alt?.trim();
    if (trimmedAlt) formData.append('alt', trimmedAlt);
    return formData;
  }

  /**
   * Uploads or replaces the thumbnail and returns the whole updated category.
   * The server uploads the new file BEFORE committing the reference and only
   * then deletes the old asset, so a failure at any point leaves the category
   * pointing at a working image rather than at nothing.
   */
  async uploadThumbnail(id: string, image: PickedCategoryImage, alt?: string): Promise<Category> {
    const res = await apiClient.upload<ApiEnvelope<{ category: Category }>>(
      `${this.basePath}/${id}/thumbnail`,
      this.buildMediaFormData(image, alt),
      { timeoutMs: 60_000 },
    );
    return res.data.category;
  }

  /** Clears the thumbnail reference and deletes the stored asset. */
  async removeThumbnail(id: string): Promise<Category> {
    const res = await apiClient.delete<ApiEnvelope<{ category: Category }>>(
      `${this.basePath}/${id}/thumbnail`,
    );
    return res.data.category;
  }

  /** Uploads or replaces the banner and returns the whole updated category. */
  async uploadBanner(id: string, image: PickedCategoryImage, alt?: string): Promise<Category> {
    const res = await apiClient.upload<ApiEnvelope<{ category: Category }>>(
      `${this.basePath}/${id}/banner`,
      this.buildMediaFormData(image, alt),
      { timeoutMs: 60_000 },
    );
    return res.data.category;
  }

  /** Clears the banner reference and deletes the stored asset. */
  async removeBanner(id: string): Promise<Category> {
    const res = await apiClient.delete<ApiEnvelope<{ category: Category }>>(
      `${this.basePath}/${id}/banner`,
    );
    return res.data.category;
  }
}

export const categoryService = new CategoryService();
export { CategoryService };
