import { apiClient, type ApiEnvelope } from '@/api';
import type {
  CreateProductInput,
  ManagedImageInput,
  ManagedVideoInput,
  PickedMediaFile,
  Product,
  ProductImagesData,
  ProductListData,
  ProductListParams,
  ProductVideosData,
  UpdateProductInput,
} from '../types';

/**
 * All product API calls (mirrors `self_aura_frontend`'s productService).
 *
 * Endpoints (permission enforced backend-side):
 *   GET    /products               - paginated list: search/filter/sort (products.view)
 *   GET    /products/:id           - single product (products.view)
 *   POST   /products               - create (products.create)
 *   PATCH  /products/:id           - update (products.edit)
 *   DELETE /products/:id           - soft deactivate, isActive=false (products.delete)
 *   POST   /products/:id/images    - upload one image (products.edit)
 *   PUT    /products/:id/images/order - replace the whole image list (products.edit)
 *   POST   /products/:id/videos    - upload one video (products.edit)
 *   PUT    /products/:id/videos/order - replace the whole video list (products.edit)
 *
 * This service performs no business math: money, stock and validation are
 * the backend's responsibility; the client only mirrors field rules for
 * faster feedback and always treats backend errors as authoritative. The
 * list responses already embed the MANAGED image/video lists (each carries
 * the `key` the media APIs address an asset by), so there is no separate
 * "fetch media" step on mobile - one product fetch powers the detail screen
 * and the media managers.
 *
 * Media uploads are multipart (`file` + optional `alt`) sent through the
 * authenticated API client. The app never holds Cloudinary credentials -
 * the backend owns the provider entirely. Video files can be large, so the
 * video uploads use a longer timeout than photos.
 */
class ProductService {
  private readonly basePath = '/products';

  async list(params: ProductListParams = {}): Promise<ProductListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      category: params.category,
      isActive: params.isActive,
      lowStock: params.lowStock,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };
    const res = await apiClient.get<ApiEnvelope<ProductListData>>(this.basePath, {
      params: query,
    });
    return res.data;
  }

  /** Authoritative product detail - fetched by ID only, never passed around. */
  async getById(id: string): Promise<Product> {
    const res = await apiClient.get<ApiEnvelope<Product>>(`${this.basePath}/${id}`);
    return res.data;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const res = await apiClient.post<ApiEnvelope<Product>>(this.basePath, input);
    return res.data;
  }

  /** Update accepts any subset of the product fields; `isActive` is edit-only. */
  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const res = await apiClient.patch<ApiEnvelope<Product>>(`${this.basePath}/${id}`, input);
    return res.data;
  }

  /**
   * Soft delete: the backend deactivates the product (`isActive = false`),
   * exactly like the web app's DELETE call. Reactivation is a PATCH
   * (`isActive: true`) via the edit form, never this endpoint.
   */
  async deactivate(id: string): Promise<Product> {
    const res = await apiClient.delete<ApiEnvelope<Product>>(`${this.basePath}/${id}`);
    return res.data;
  }

  // ---------------------------------------------------------------------------
  // Media
  //
  // Uploads are one-file-per-request multipart (the web app's manager queues
  // files and posts them one by one as well). Reordering and alt-text edits
  // are committed as one atomic list-replace via the order endpoints, so the
  // whole list is validated by the backend before anything changes and a
  // failure leaves the product untouched. Responses always carry the FULL
  // managed list, so the client never re-assembles media state.
  // ---------------------------------------------------------------------------

  private buildMediaFormData(file: PickedMediaFile, alt?: string): FormData {
    const formData = new FormData();
    // RN FormData file reference: the runtime turns this object into a
    // multipart part with filename + MIME type. Kept as a Blob-typed value
    // because React Native's FormData types accept browser Blobs.
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
    const trimmedAlt = alt?.trim();
    if (trimmedAlt) formData.append('alt', trimmedAlt);
    return formData;
  }

  async uploadImage(id: string, file: PickedMediaFile, alt?: string): Promise<ProductImagesData> {
    const res = await apiClient.upload<ApiEnvelope<ProductImagesData>>(
      `${this.basePath}/${id}/images`,
      this.buildMediaFormData(file, alt),
      { timeoutMs: 60_000 },
    );
    return res.data;
  }

  async updateImagesOrder(id: string, images: ManagedImageInput[]): Promise<ProductImagesData> {
    const res = await apiClient.put<ApiEnvelope<ProductImagesData>>(
      `${this.basePath}/${id}/images/order`,
      { images },
    );
    return res.data;
  }

  async uploadVideo(id: string, file: PickedMediaFile, alt?: string): Promise<ProductVideosData> {
    const res = await apiClient.upload<ApiEnvelope<ProductVideosData>>(
      `${this.basePath}/${id}/videos`,
      this.buildMediaFormData(file, alt),
      { timeoutMs: 180_000 },
    );
    return res.data;
  }

  async updateVideosOrder(id: string, videos: ManagedVideoInput[]): Promise<ProductVideosData> {
    const res = await apiClient.put<ApiEnvelope<ProductVideosData>>(
      `${this.basePath}/${id}/videos/order`,
      { videos },
    );
    return res.data;
  }
}

export const productService = new ProductService();
export { ProductService };
