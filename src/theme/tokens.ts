import type { TextStyle } from 'react-native';

/**
 * Design tokens for the Self Aura mobile app.
 *
 * The palette is derived from the management web app
 * (`self_aura_frontend/src/app/globals.css`) so both surfaces feel like one
 * product, while the spacing/radius/typography scale is tuned for mobile:
 * premium, clean, rounded cards, comfortable touch targets, subtle shadows.
 *
 * Components must consume these tokens - colors are never hardcoded in
 * component files. Theme-dependent values (soft tints, overlays, shadows)
 * live on `AppTheme` via `useTheme()`; the pure scales below are shared by
 * every mode.
 */

export type ResolvedThemeMode = 'light' | 'dark';

export interface ThemeColors {
  /** App background behind all screens. */
  background: string;
  /** Default card / sheet background. */
  surface: string;
  /** Higher-elevation surface (modals, sticky bars, pressed cards). */
  surfaceElevated: string;
  /** Recessed surface: secondary buttons, neutral chips, skeleton blocks. */
  surfaceMuted: string;
  border: string;

  /** Primary brand action color. */
  primary: string;
  /** Pressed/active state of primary actions. */
  primaryPressed: string;
  /** Tinted primary background (selected chips, icon pills, soft badges). */
  primarySoft: string;
  /** Text/icon on top of `primarySoft` (darker/lighter for contrast). */
  primaryOnSoft: string;
  /** Text/icon on top of solid `primary`. */
  onPrimary: string;

  success: string;
  /** Tinted success background (soft badges, inline confirmations). */
  successSoft: string;
  /** Text/icon on top of `successSoft`. */
  successOnSoft: string;

  warning: string;
  /** Tinted warning background (soft badges, inline warnings). */
  warningSoft: string;
  /** Text/icon on top of `warningSoft`. */
  warningOnSoft: string;
  /** Text/icon on top of solid `warning` (dark ink in dark mode, like the web). */
  onWarning: string;

  danger: string;
  /** Tinted danger background (soft badges, inline errors). */
  dangerSoft: string;
  /** Text/icon on top of `dangerSoft`. */
  dangerOnSoft: string;

  info: string;
  /** Tinted info background (soft badges, hints). */
  infoSoft: string;
  /** Text/icon on top of `infoSoft`. */
  infoOnSoft: string;

  /** Primary body/heading text. */
  text: string;
  /** Supporting copy (subtitles, metadata) - one step lighter than `text`. */
  textSecondary: string;
  /** Placeholder/tertiary copy. */
  textMuted: string;
  /** Disabled copy. */
  textDisabled: string;
  /** Default glyph color (mirrors `text`). */
  icon: string;
  /** De-emphasized glyph color (mirrors `textMuted`). */
  iconMuted: string;
  /** Scrim behind modals and bottom sheets. */
  overlay: string;
}

export const lightColors: ThemeColors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#EEF2F6',
  border: '#E5E7EB',
  primary: '#2563EB',
  primaryPressed: '#1D4ED8',
  primarySoft: '#EFF6FF',
  primaryOnSoft: '#1D4ED8',
  onPrimary: '#FFFFFF',
  success: '#059669',
  successSoft: '#ECFDF5',
  successOnSoft: '#047857',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  warningOnSoft: '#92400E',
  onWarning: '#FFFFFF',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  dangerOnSoft: '#B91C1C',
  info: '#0891B2',
  infoSoft: '#ECFEFF',
  infoOnSoft: '#0E7490',
  text: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textDisabled: '#9CA3AF',
  icon: '#111827',
  iconMuted: '#6B7280',
  overlay: 'rgba(17, 24, 39, 0.45)',
};

export const darkColors: ThemeColors = {
  background: '#0B0D0F',
  surface: '#15181C',
  surfaceElevated: '#1B1F24',
  surfaceMuted: '#1B1F24',
  border: '#272C33',
  primary: '#3B82F6',
  primaryPressed: '#2563EB',
  primarySoft: '#172554',
  primaryOnSoft: '#93C5FD',
  onPrimary: '#FFFFFF',
  success: '#10B981',
  successSoft: '#022C22',
  successOnSoft: '#6EE7B7',
  warning: '#F59E0B',
  warningSoft: '#2E2109',
  warningOnSoft: '#FCD34D',
  onWarning: '#0B0D0F',
  danger: '#EF4444',
  dangerSoft: '#351315',
  dangerOnSoft: '#FCA5A5',
  info: '#06B6D4',
  infoSoft: '#0A2A33',
  infoOnSoft: '#67E8F9',
  text: '#F5F7FA',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  textDisabled: '#6B7280',
  icon: '#F5F7FA',
  iconMuted: '#9CA3AF',
  overlay: 'rgba(0, 0, 0, 0.65)',
};

/**
 * 4pt spacing grid - every margin/padding/gap should come from this scale
 * (`xxl` = the suggested "2xl" (24), `xxxl` = "3xl" (32); JS identifiers
 * cannot start with a digit, so `xxl`/`xxxl` are the readable spellings).
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Rounded, card-first corner scale (pill = the "pills/chips/badges" radius). */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Standard control heights - buttons and fields stay on this ladder. */
export const controlHeights = {
  sm: 36,
  md: 44,
  lg: 52,
} as const;

/** Semantic text variants consumed by the `Text` component. */
export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodyMedium'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'button'
  | 'numeric';

/** Custom font families for display/brand text. */
export const fontFamilies = {
  /** Elegant serif for brand titles and display text (Bodoni Moda). */
  display: 'BodoniModa-Bold',
  /** Semi-bold variant for headings. */
  displayMedium: 'BodoniModa-SemiBold',
  /** Regular variant for body text when needed. */
  displayRegular: 'BodoniModa-Regular',
} as const;

const textStyles = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.4, fontFamily: fontFamilies.display },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3, fontFamily: fontFamilies.display },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2, fontFamily: fontFamilies.displayMedium },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.1 },
  title: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  subtitle: { fontSize: 15, lineHeight: 21, fontWeight: '500' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  bodyMedium: { fontSize: 15, lineHeight: 21, fontWeight: '500' },
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0.2 },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.2 },
  button: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  // Statistic/price emphasis with tabular figures so columns line up.
  numeric: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<TextVariant, TextStyle>;

export const typography = {
  /** Semantic styles: what `Text variant=...` resolves to. */
  textStyles,
  /** Shared weight names (used by the `Text weight=` override). */
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } satisfies Record<'regular' | 'medium' | 'semibold' | 'bold', TextStyle['fontWeight']>,
  /** Custom font families for display text. */
  fontFamilies,
} as const;

export const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

/** Minimum comfortable touch target (Material/iOS guidance). */
export const MIN_TOUCH_TARGET = 44;

export interface ThemeShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  /** Android elevation. */
  elevation: number;
}

/**
 * Elevation ladder: `sm` (cards), `md` (sticky bars/sheets), `lg` (dialogs).
 * "none" = simply omit the shadow (the dark theme leans on its `border`
 * token plus a subtle shadow rather than large glow effects).
 */
export type ShadowLevel = 'sm' | 'md' | 'lg';

const lightShadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
} satisfies Record<ShadowLevel, ThemeShadow>;

const darkShadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.36,
    shadowRadius: 16,
    elevation: 8,
  },
} satisfies Record<ShadowLevel, ThemeShadow>;

/** Fully resolved theme for one mode - what components consume via `useTheme()`. */
export interface AppTheme {
  mode: ResolvedThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  controlHeights: typeof controlHeights;
  typography: typeof typography;
  iconSizes: typeof iconSizes;
  shadows: Record<ShadowLevel, ThemeShadow>;
}

export function createTheme(mode: ResolvedThemeMode): AppTheme {
  return {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    controlHeights,
    typography,
    iconSizes,
    shadows: mode === 'dark' ? darkShadows : lightShadows,
  };
}
