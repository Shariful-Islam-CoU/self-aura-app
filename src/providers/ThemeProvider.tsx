import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { createTheme, type AppTheme, type ResolvedThemeMode } from '@/theme';

/** User preference: follow the system, or force one mode. */
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  /** The user's stored preference. */
  mode: ThemeMode;
  /** The mode tokens are currently resolved for. */
  resolvedMode: ResolvedThemeMode;
  /** Design tokens for `resolvedMode`. */
  theme: AppTheme;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'self_aura_theme_mode';

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * Light / dark / system theme with a persisted preference.
 *
 * The preference is a small non-sensitive value, so AsyncStorage (not
 * SecureStore) is the right store. Tokens live in `src/theme/tokens.ts`;
 * components never read colors from anywhere else.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  // Restore the stored preference once on mount; keep "system" until then so
  // the first paint already follows the device setting.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && isThemeMode(stored)) setMode(stored);
      } catch {
        // Unreadable preference falls back to "system" - never blocks startup.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setMode(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // A failed write only loses the preference; the in-memory mode still applies.
    });
  }, []);

  const resolvedMode: ResolvedThemeMode =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolvedMode, theme: createTheme(resolvedMode), setTheme }),
    [mode, resolvedMode, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
