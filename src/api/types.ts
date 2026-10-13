/**
 * Shared API response/error types.
 *
 * These mirror the `self_aura_backend` wire contract as consumed by
 * `self_aura_frontend` (`src/lib/api/types.ts`) - every response is wrapped in
 * an `{ success, message, data }` envelope, and validation failures are 400
 * responses carrying `details: [{ path, message }]`.
 */

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiErrorResponse {
  message: string;
  /** Stable machine-readable error code from the backend (AppError.code). */
  code?: string;
  details?: ApiErrorDetail[];
  errors?: Record<string, string[]>;
  statusCode?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  /** Query-string parameters; `undefined`/`null` entries are skipped. */
  params?: Record<string, QueryValue>;
  headers?: Record<string, string>;
  /** Cancels the request when aborted. */
  signal?: AbortSignal;
  /** Per-request timeout; defaults to the client's timeout. */
  timeoutMs?: number;
}

/**
 * Failure categories for every layer of the app's error strategy. Drives the
 * query retry policy, the user-facing copy in `src/api/errors.ts`, and dev
 * logging - branches should switch on `kind`, not re-derive it from `status`.
 */
export type ApiErrorKind =
  /** fetch failed before a response arrived (offline, refused, DNS). */
  | 'network'
  /** The request exceeded its deadline. */
  | 'timeout'
  /** Aborted by the caller (screen unmount, superseded request) - do not retry. */
  | 'cancelled'
  /** 401 - missing/expired credentials. */
  | 'authentication'
  /** 403 - authenticated but not permitted. */
  | 'authorization'
  /** 400/409/422 - rejected input; field-level details are attached. */
  | 'validation'
  /** 404 - resource does not exist. */
  | 'notFound'
  /** 429 - rate limited by backend. */
  | 'rateLimited'
  /** 5xx - backend failure; message must never be trusted by the UI. */
  | 'server'
  /** Anything else (unreadable body, unexpected status, unknown throw). */
  | 'unexpected';

function kindFromStatus(status: number): ApiErrorKind {
  if (status >= 500) return 'server';
  if (status === 401) return 'authentication';
  if (status === 403) return 'authorization';
  if (status === 404) return 'notFound';
  if (status === 429) return 'rateLimited';
  if (status === 400 || status === 409 || status === 422) return 'validation';
  // Convention: status 0 means no HTTP response ever arrived.
  if (status === 0) return 'network';
  return 'unexpected';
}

export interface ApiErrorOptions {
  /** Per-field messages; backend validation details are folded into it. */
  errors?: Record<string, string[]>;
  details?: ApiErrorDetail[];
  /** Stable machine-readable error code from the backend (AppError.code). */
  code?: string;
  /** Overrides the status-derived kind (required for timeout/cancelled). */
  kind?: ApiErrorKind;
}

/**
 * Normalized error thrown by the API client for any non-2xx response, timeout,
 * cancellation, or network failure.
 *
 * `errors` is keyed by field path (backend validation details are folded into
 * it) so forms can surface field-level messages.
 */
export class ApiError extends Error {
  public readonly status: number;
  /** Stable failure category - see `ApiErrorKind`. */
  public readonly kind: ApiErrorKind;
  public readonly errors?: Record<string, string[]>;
  public readonly details?: ApiErrorDetail[];
  /** Stable backend error code (e.g. 'VALIDATION_FAILED', 'TOKEN_EXPIRED'). */
  public readonly code?: string;
  public readonly isApiError = true;

  constructor(message: string, status: number, options: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = options.kind ?? kindFromStatus(status);
    this.errors = options.errors;
    this.details = options.details;
    this.code = options.code;
  }

  static fromResponse(status: number, data: ApiErrorResponse): ApiError {
    // Normalize backend validation details into a per-field errors map so
    // forms can surface field-level messages.
    const errors: Record<string, string[]> = {};
    if (data.errors) {
      for (const [key, value] of Object.entries(data.errors)) {
        errors[key] = value;
      }
    }
    if (data.details) {
      for (const detail of data.details) {
        if (!detail || !detail.path || !detail.message) continue;
        if (!errors[detail.path]) errors[detail.path] = [];
        errors[detail.path].push(detail.message);
      }
    }
    return new ApiError(data.message || `API Error: ${status}`, status, {
      errors,
      details: data.details,
      code: data.code,
    });
  }

  /** True when the failure is a client error (4xx) that retrying will not fix. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

/** Pagination request parameters (matches common backend query contract). */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Generic list query parameters (search/filter/sort). */
export interface ListQueryParams extends PaginationParams {
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: QueryValue;
}
