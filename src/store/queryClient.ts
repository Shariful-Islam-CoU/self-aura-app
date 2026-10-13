import { isApiError } from '@/api/errors';
import { QueryClient } from '@tanstack/react-query';

/**
 * Server-state store (TanStack Query).
 *
 * Server data belongs here, not in a global client store: caching, retries,
 * and refetching are declarative and shared by every feature. Local UI state
 * stays in component state; the session stays in `AuthProvider`.
 *
 * Query/mutation hooks are deliberately NOT configured per feature here -
 * each feature adds its own hooks when it is implemented.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Fresh enough to avoid refetching on every screen focus, stale enough
      // to pick up changes without manual invalidation.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      // Cancellation is intentional (navigation/unmount) - never retry it.
      // Client errors (4xx) are definitive - retrying a 403 or 404 is wasted
      // work; transient server/network failures get a couple of attempts.
      retry: (failureCount, error) => {
        if (isApiError(error) && (error.kind === 'cancelled' || error.isClientError)) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
