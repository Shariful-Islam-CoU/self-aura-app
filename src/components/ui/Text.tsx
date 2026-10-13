import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { typography, type TextVariant } from '@/theme';

/** Preset color roles resolved against the current theme. */
export type TextTone =
  | 'default'
  | 'secondary'
  | 'muted'
  | 'inverse'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface AppTextProps extends TextProps {
  /** Semantic style from the typography scale (default: `body`). */
  variant?: TextVariant;
  tone?: TextTone;
  /** Overrides the variant's weight (e.g. bold numbers inside body copy). */
  weight?: keyof typeof typography.fontWeight;
  align?: TextStyle['textAlign'];
}

/**
 * Single text primitive: every string rendered by the app goes through this
 * component so size/weight/color always come from the theme's typography
 * scale instead of ad-hoc styles.
 */
export function Text({
  variant = 'body',
  tone = 'default',
  weight,
  align,
  style,
  ...rest
}: AppTextProps) {
  const { theme } = useTheme();

  const toneColor: string = {
    default: theme.colors.text,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    inverse: theme.colors.onPrimary,
    primary: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    info: theme.colors.info,
  }[tone];

  const base = theme.typography.textStyles[variant];

  return (
    <RNText
      style={[
        {
          ...base,
          color: toneColor,
          fontWeight: weight ? theme.typography.fontWeight[weight] : base.fontWeight,
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    />
  );
}
