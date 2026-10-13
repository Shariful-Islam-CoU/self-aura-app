import { Ionicons } from '@expo/vector-icons';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { radius, spacing } from '@/theme';
import type { IconName } from '@/types';
import { useTheme } from './ThemeProvider';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  /** Milliseconds before auto-dismiss; 0 keeps it until tapped (default 3500). */
  duration?: number;
}

interface ToastState extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 3500;

const TONE_ICONS: Record<ToastTone, IconName> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  warning: 'warning',
  info: 'information-circle',
};

const TONE_COLOR_KEYS = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'info',
} as const;

/**
 * Transient feedback banner for action results ("Order updated
 * successfully", "Payment verification failed"). One toast at a time - a
 * newer message replaces the current one instead of stacking banners.
 *
 * Mounted once in `Providers` (inside `ThemeProvider`, so it follows the
 * active mode). Screens consume it through `useToast()`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastId = useRef(0);
  // Lazy state init (not refs): both values are read during render for the
  // Animated style and must be stable instances across re-renders.
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-16));

  const dismiss = useCallback(() => {
    const id = toastId.current;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -16, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      // Only clear if no newer toast replaced this one mid-animation.
      if (finished && toastId.current === id) setToast(null);
    });
  }, [opacity, translateY]);

  const show = useCallback((options: ToastOptions) => {
    toastId.current += 1;
    setToast({ ...options, id: toastId.current });
  }, []);

  // Entry animation + auto-dismiss timer for each newly shown toast.
  useEffect(() => {
    if (!toast) return undefined;

    opacity.setValue(0);
    translateY.setValue(-16);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();

    const duration = toast.duration ?? DEFAULT_DURATION;
    if (duration <= 0) return undefined;

    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [toast, opacity, translateY, dismiss]);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      dismiss,
      success: (message) => show({ message, tone: 'success' }),
      error: (message) => show({ message, tone: 'error' }),
      warning: (message) => show({ message, tone: 'warning' }),
      info: (message) => show({ message, tone: 'info' }),
    }),
    [show, dismiss],
  );

  const tone = toast?.tone ?? 'info';

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          style={[styles.host, { paddingTop: insets.top + spacing.sm, zIndex: 50 }]}
        >
          <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            <Pressable
              accessibilityRole="alert"
              accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
              accessibilityLabel={toast.message}
              onPress={dismiss}
              style={[
                styles.toast,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
                theme.shadows.md,
              ]}
            >
              <Ionicons
                name={TONE_ICONS[tone]}
                size={20}
                color={theme.colors[TONE_COLOR_KEYS[tone]]}
              />
              <Text variant="bodyMedium" style={styles.message} numberOfLines={3}>
                {toast.message}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  message: {
    flex: 1,
  },
});
