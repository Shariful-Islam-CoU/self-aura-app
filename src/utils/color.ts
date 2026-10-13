/**
 * Returns an 8-digit hex color (`#RRGGBBAA`) - React Native understands
 * 8-digit hex natively, which keeps tinted surfaces (badges, pressed rows,
 * icon chips) free of platform-specific alpha APIs.
 */
export function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;

  const clamped = Math.min(1, Math.max(0, alpha));
  const alphaHex = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${clean}${alphaHex}`.toUpperCase();
}
