import type { ListQueryParams, PaginationParams, QueryValue } from './types';

/**
 * Small helper to build safe query params for list endpoints.
 * Ensures undefined/null are omitted and values are typed as QueryValue.
 */
export function toQueryParams(
  params: ListQueryParams | PaginationParams | undefined | null,
): Record<string, QueryValue> | undefined {
  if (!params) return undefined;

  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return undefined;

  return Object.fromEntries(entries) as Record<string, QueryValue>;
}
