import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme } from '@/providers/ThemeProvider';
import { radius, type StatusTone } from '@/theme';

const sizes = { sm: 32, md: 40, lg: 56 } as const;

export interface AvatarProps {
  /** Display name - initials are derived from it when there is no image. */
  name?: string;
  /** Remote image URL (people/products); omitted -> initials/icon fallback. */
  source?: string | null;
  size?: keyof typeof sizes;
  /** Optional status dot (e.g. `success` for active users). */
  status?: StatusTone;
  style?: StyleProp<ViewStyle>;
}

function initialsOf(name?: string): string {
  if (!name) return '';
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map((word) => word.charAt(0).toUpperCase()).join('');
}

/**
 * Circular identity mark: image when available, initials otherwise. Kept on
 * a single brand tint (primarySoft/primaryOnSoft) instead of per-user hues,
 * so the app never grows unrelated accent colors.
 */
export function Avatar({ name, source, size = 'md', status, style }: AvatarProps) {
  const { theme } = useTheme();
  const dimension = sizes[size];
  const dotSize = Math.max(8, Math.round(dimension / 4));
  const initials = initialsOf(name);

  const statusColor = status
    ? {
        neutral: theme.colors.textMuted,
        primary: theme.colors.primary,
        success: theme.colors.success,
        warning: theme.colors.warning,
        danger: theme.colors.danger,
        info: theme.colors.info,
      }[status]
    : undefined;

  return (
    <View style={[{ width: dimension, height: dimension }, style]}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            { width: dimension, height: dimension, borderRadius: dimension / 2 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.image,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
              backgroundColor: theme.colors.primarySoft,
            },
          ]}
        >
          {initials ? (
            <Text
              variant={size === 'lg' ? 'title' : 'bodyMedium'}
              style={{ color: theme.colors.primaryOnSoft }}
            >
              {initials}
            </Text>
          ) : (
            <Ionicons
              name="person"
              size={Math.round(dimension * 0.5)}
              color={theme.colors.primaryOnSoft}
            />
          )}
        </View>
      )}

      {statusColor ? (
        <View
          style={[
            styles.status,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: radius.pill,
              backgroundColor: statusColor,
              borderColor: theme.colors.surface,
            },
          ]}
          accessibilityLabel={`Status: ${status}`}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  status: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderWidth: 2,
  },
});
