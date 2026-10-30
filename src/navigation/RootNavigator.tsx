import { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LoadingIndicator } from '@/components/feedback';
import { useNotificationObserver } from '@/features/notifications/hooks/useNotificationObserver';
import { useAuth, useTheme } from '@/providers';

/**
 * Root navigator: splits the app into two protected route groups.
 *
 * - `(main)` - authenticated shell (tabs + module screens), guarded by a
 *   session (or the temporary Step-1 shell preview).
 * - `(auth)` - sign-in flow, guarded by the ABSENCE of a session so it is
 *   unreachable while signed in.
 *
 * Uses Expo Router's `Stack.Protected` guards: when a guard turns false the
 * router removes those screens from history and redirects to the first
 * available screen (login <-> shell), which is exactly the auth behaviour we
 * want with no manual redirect bookkeeping.
 */
export function RootNavigator() {
  const { isLoading, isAuthenticated, isShellPreview } = useAuth();
  const { theme, resolvedMode } = useTheme();

  useNotificationObserver();

  // Keep the native splash screen visible until the stored session has been
  // restored, so the first frame is always the correct route group.
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hide();
    }
  }, [isLoading]);

  const isSignedIn = isAuthenticated || isShellPreview;

  return (
    <>
      {/* Theme-aware status bar in every state, including the short loading
          frame; follows the resolved (not system) mode so a forced light
          theme keeps dark status-bar icons even on a dark device. */}
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      {isLoading ? (
        // Only visible for the (very short) session-restore window; the splash
        // screen covers this state on native.
        <LoadingIndicator fullScreen />
      ) : (
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.text,
            headerTitleStyle: { color: theme.colors.text },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Protected guard={isSignedIn} >
            <Stack.Screen name="(main)" options={{headerShown:false}}/>
          </Stack.Protected>

          <Stack.Protected guard={!isSignedIn}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      )}
    </>
  );
}
