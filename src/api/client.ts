import { env } from '@/config/env';
import { getMemoryToken } from '@/features/auth/sessionStorage';
import { logApiError } from './errors';
import { ApiError, type ApiErrorResponse, type HttpMethod, type RequestOptions } from './types';

export interface ApiClientOptions {
  baseUrl: string;
  /** Returns the current JWT, or `null` when signed out. */
  getToken: () => string | null;
  /** Default request timeout in milliseconds. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;

type RequestBody = unknown;

/**
 * Centralized fetch wrapper for the whole app.
 *
 * Behavior (method set, Bearer auth, envelope, 401 handling) follows the web
 * app's `self_aura_frontend/src/lib/api/client.ts` so both clients speak the
 * same `self_aura_backend` contract. Differences from the web client are
 * mobile-specific: no `credentials` mode (auth is a Bearer header, RN fetch
 * has no cookie mode), a portable timeout via `AbortController`, and query
 * strings built manually instead of `new URL` (Hermes URL support is partial).
 *
 * Features must use this client - never their own `fetch` - so auth headers,
 * timeouts, and error normalization stay consistent.
 */
export class ApiClient {
  private static unauthorizedHandler: (() => void) | null = null;

  /** Registered once (by AuthProvider) and invoked on any 401 response. */
  static setUnauthorizedHandler(handler: (() => void) | null): void {
    ApiClient.unauthorizedHandler = handler;
  }

  private readonly baseUrl: string;
  private readonly getToken: () => string | null;
  private readonly timeoutMs: number;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.getToken = options.getToken;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private buildUrl(endpoint: string, params?: RequestOptions['params']): string {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${path}`;
    if (!params) return url;

    const query: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      query.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
    return query.length > 0 ? `${url}?${query.join('&')}` : url;
  }

  private buildHeaders(extra?: Record<string, string>, hasBody?: boolean) {
    const headers: Record<string, string> = { Accept: 'application/json', ...extra };
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (hasBody) headers['Content-Type'] = 'application/json';
    return headers;
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    options: RequestOptions = {},
    body?: RequestBody,
    isMultipart = false,
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options.params);
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;

    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const onExternalAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onExternalAbort);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        // Multipart bodies must NOT carry a pre-set Content-Type: RN fetch
        // generates the boundary itself, and pinning `multipart/form-data`
        // without it would break the request (the backend's multer parser
        // needs the exact boundary the runtime produced).
        headers: this.buildHeaders(options.headers, body !== undefined && !isMultipart),
        body:
          body !== undefined
            ? isMultipart
              ? (body as BodyInit)
              : JSON.stringify(body)
            : undefined,
        signal: controller.signal,
      });
    } catch {
      if (timedOut) {
        throw this.raise(
          method,
          endpoint,
          new ApiError(`The request timed out after ${Math.round(timeoutMs / 1000)}s.`, 0, {
            kind: 'timeout',
          }),
        );
      }
      if (options.signal?.aborted) {
        throw this.raise(
          method,
          endpoint,
          new ApiError('The request was cancelled.', 0, { kind: 'cancelled' }),
        );
      }
      throw this.raise(
        method,
        endpoint,
        new ApiError('Network request failed. Check your connection and try again.', 0, {
          kind: 'network',
        }),
      );
    } finally {
      clearTimeout(timeoutId);
      options.signal?.removeEventListener('abort', onExternalAbort);
    }

    if (!response.ok) {
      let errorData: ApiErrorResponse = { message: `API Error: ${response.status}` };
      try {
        errorData = (await response.json()) as ApiErrorResponse;
      } catch {
        // Non-JSON body (proxy/infra failure): the status still yields a usable error.
      }
      if (response.status === 401) {
        ApiClient.unauthorizedHandler?.();
      }
      throw this.raise(method, endpoint, ApiError.fromResponse(response.status, errorData));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const raw = await response.text();
    if (raw === '') {
      return undefined as T;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw this.raise(
        method,
        endpoint,
        new ApiError('The server returned an unreadable response.', response.status),
      );
    }
  }

  /**
   * Dev-only failure logging + rethrow so every failed request is observable
   * during development without changing production behavior. Cancelled
   * requests are intentional (navigation/unmount) and stay out of the logs.
   */
  private raise(method: HttpMethod, endpoint: string, error: ApiError): never {
    if (error.kind !== 'cancelled') {
      logApiError(method, endpoint, error);
    }
    throw error;
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, options);
  }

  post<T>(endpoint: string, body?: RequestBody, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, options, body);
  }

  put<T>(endpoint: string, body?: RequestBody, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, options, body);
  }

  patch<T>(endpoint: string, body?: RequestBody, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', endpoint, options, body);
  }

  /**
   * Multipart file upload (POST). Backed by the same request pipeline as the
   * JSON methods - auth header, timeout, envelope parsing and error
   * normalization stay identical - but the body is a RN `FormData` (local
   * file references) instead of a serialized object. Used for the
   * media-upload endpoints (product/category images): files always go
   * through the backend's authenticated upload API, never a third party.
   */
  upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, options, formData, true);
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, options);
  }
}

/**
 * The app-wide client instance. The base URL comes from `src/config/env.ts`
 * (EXPO_PUBLIC_API_URL); the token comes from the in-memory mirror kept by
 * `features/auth/sessionStorage` after the session is restored.
 */
export const apiClient = new ApiClient({
  baseUrl: env.apiUrl,
  getToken: getMemoryToken,
});
