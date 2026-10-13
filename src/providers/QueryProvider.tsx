import {
  focusManager,
  QueryClientProvider,
  type QueryClientProviderProps,
} from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { queryClient } from '@/store';

/**
 * Hosts the shared TanStack Query client for the whole app.
 *
 * Also bridges React Native's AppState to the query client's focus manager, so
 * queries behave like the web app's refetch-on-window-focus: returning to the
 * foreground refetches queries that have gone stale (within `staleTime`).
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// Re-exported so future code can type query hooks against the same client.
export type { QueryClientProviderProps };
