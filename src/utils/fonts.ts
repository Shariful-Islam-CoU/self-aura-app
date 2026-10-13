import * as Font from 'expo-font';
import { useFonts } from 'expo-font';
import {
  BodoniModa_400Regular,
  BodoniModa_500Medium,
  BodoniModa_600SemiBold,
  BodoniModa_700Bold,
} from '@expo-google-fonts/bodoni-moda';

/**
 * Load Bodoni Moda font family for the app.
 * Returns a promise that resolves when all fonts are loaded.
 */
export async function loadFonts(): Promise<void> {
  await Font.loadAsync({
    'BodoniModa-Regular': BodoniModa_400Regular,
    'BodoniModa-Medium': BodoniModa_500Medium,
    'BodoniModa-SemiBold': BodoniModa_600SemiBold,
    'BodoniModa-Bold': BodoniModa_700Bold,
  });
}

/**
 * Hook to load Bodoni Moda fonts with loading state tracking.
 * Use this in components that need to wait for fonts to be ready.
 */
export function useBodoniModaFonts(): [boolean, Error | null] {
  return useFonts({
    'BodoniModa-Regular': BodoniModa_400Regular,
    'BodoniModa-Medium': BodoniModa_500Medium,
    'BodoniModa-SemiBold': BodoniModa_600SemiBold,
    'BodoniModa-Bold': BodoniModa_700Bold,
  });
}

export const fontFamilies = {
  /** Elegant serif for brand titles and display text. */
  display: 'BodoniModa-Bold',
  /** Semi-bold variant for headings. */
  displayMedium: 'BodoniModa-SemiBold',
  /** Regular variant for body text when needed. */
  displayRegular: 'BodoniModa-Regular',
} as const;

export type DisplayFontFamily = keyof typeof fontFamilies;