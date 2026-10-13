import { env } from '@/config/env';

import { ApiError, type ApiErrorKind } from './types';

/**
 * Error-handling helpers shared by every layer (screens, forms, feedback).
 *
 * Rules (see README "Architecture & Development Rules"):
 * - UI surfaces text through `getErrorMessage` only - never raw `error.message`
 *   from an unknown throw, and never backend 5xx output.
 * - `ApiError.kind` is the single branching key for retry, copy, and recovery.
 * - Logging is dev-only and metadata-only (method/endpoint/status/kind/message);
 *   tokens, headers, and response bodies are never logged.
 */

/** Safe, user-facing fallback copy per failure kind. */
const FALLBACK_MESSAGES: Record<ApiErrorKind, string> = {
  network: 'You appear to be offline. Check your connection and try again.',
  timeout: 'The request took too long. Please try again.',
  cancelled: 'The request was cancelled.',
  authentication: 'Your session has expired. Please sign in again.',
  authorization: "You don't have permission to do that.",
  validation: 'Please check the highlighted fields and try again.',
  notFound: "We couldn't find what you were looking for.",
  rateLimited: 'Too many requests. Please slow down and try again.',
  server: 'Something went wrong on our side. Please try again.',
  unexpected: 'Something went wrong. Please try again.',
};

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Turns any thrown value into short, user-safe text for UI surfaces.
 *
 * - `network`/`timeout`/`cancelled` messages are written by this app, so they
 *   are already user-facing.
 * - Backend 4xx messages are user-facing by contract (the same text the web
 *   app shows) and are used when present.
 * - Backend 5xx messages are NOT trusted: production sanitizes them, but the
 *   mobile client cannot tell dev from prod backend output, so a generic
 *   message is shown instead (the real text still reaches the dev console).
 * - Non-`ApiError` throws never expose their internals in production.
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.kind === 'server') {
      return env.isDev && error.message ? error.message : FALLBACK_MESSAGES.server;
    }
    return error.message || FALLBACK_MESSAGES[error.kind];
  }
  if (env.isDev && error instanceof Error && error.message) {
    return error.message;
  }
  return FALLBACK_MESSAGES.unexpected;
}

/**
 * Dev-only failure logging for the API client. No-op in production builds;
 * logs method, endpoint, status, kind, and message - never tokens or bodies.
 */
export function logApiError(method: string, endpoint: string, error: unknown): void {
  if (!env.isDev) return;
  const detail = isApiError(error)
    ? `${error.kind} (${error.status})${error.code ? ` [${error.code}]` : ''} ${error.message}`
    : error instanceof Error
      ? error.message
      : String(error);
  console.warn(`[api] ${method} ${endpoint} failed: ${detail}`);
}
