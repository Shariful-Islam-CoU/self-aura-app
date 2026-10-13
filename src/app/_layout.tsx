import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  BodoniModa_400Regular,
  BodoniModa_500Medium,
  BodoniModa_600SemiBold,
  BodoniModa_700Bold,
} from '@expo-google-fonts/bodoni-moda';

import { Providers } from '@/providers';
import { RootNavigator } from '@/navigation';

// Must run before the app renders so the native splash stays up until the
// session restore (and first frame) is done - hiding happens in RootNavigator.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already prevented (fast refresh / double import) - safe to ignore.
});

/**
 * Root layout: application-wide providers + the protected route groups.
 * No business screens live here; `src/app` only contains routes.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'BodoniModa-Regular': BodoniModa_400Regular,
    'BodoniModa-Medium': BodoniModa_500Medium,
    'BodoniModa-SemiBold': BodoniModa_600SemiBold,
    'BodoniModa-Bold': BodoniModa_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded) {
    return null; // Keep splash screen visible while fonts load
  }

  return (
    <Providers>
      <RootNavigator />
    </Providers>
  );
}
