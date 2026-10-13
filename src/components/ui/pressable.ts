import type { ViewStyle } from 'react-native';

/**
 * Shared touch-feedback vocabulary so every pressable in the app reacts the
 * same way: a small opacity drop plus (optionally) a barely-there scale.
 *
 * Values are deliberately subtle - management UIs should feel responsive,
 * not playful - and the work per press is a single style object.
 */
export const PRESSED_OPACITY = 0.72;
export const PRESSED_SCALE = 0.985;

export interface PressFeedbackOptions {
  /** Apply the scale transform (disable inside already-transformed parents). */
  scale?: boolean;
}

export function pressFeedback(pressed: boolean, options?: PressFeedbackOptions): ViewStyle {
  const scale = options?.scale ?? true;
  return {
    opacity: pressed ? PRESSED_OPACITY : 1,
    transform: pressed && scale ? [{ scale: PRESSED_SCALE }] : [],
  };
}
