import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from './ToastProvider';

/**
 * Application-wide providers, ordered outermost-first:
 *
 * SafeAreaProvider   - safe-area insets for every screen
 *   QueryProvider    - server state (TanStack Query)
 *     ThemeProvider  - light/dark tokens
 *       ToastProvider  - transient feedback banner (needs theme + insets)
 *         AuthProvider - session state (reads SecureStore on mount)
 *
 * Feature-specific providers belong next to their feature, not here.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
