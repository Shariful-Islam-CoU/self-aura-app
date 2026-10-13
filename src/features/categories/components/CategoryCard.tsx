import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatDate } from '@/utils/format';
import { categoryStatusLabel, categoryStatusTone } from '../labels';
import type { Category } from '../types';

export interface CategoryCardProps {
  category: Category;
  onPress: (categoryId: string) => void;
}

/**
 * Touch-friendly category row for the list (never a desktop table):
 * thumbnail (or a placeholder glyph), name, description/slug, then status
 * and created date. Only backend-provided fields are shown - the category
 * response has no product counts or ordering fields, so none are invented
 * here. The whole card is one accessible button whose label reads every
 * fact the visual layout shows.
 */
export function CategoryCard({ category, onPress }: CategoryCardProps) {
  const { theme } = useTheme();

  const subtitle = category.description || `/${category.slug}`;

  const label = [
    category.name,
    category.description ? `Description: ${category.description}` : `Slug: ${category.slug}`,
    categoryStatusLabel(category.isActive),
    `Created ${formatDate(category.createdAt)}`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={() => onPress(category.id)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      {category.thumbnail ? (
        <Image
          source={{ uri: category.thumbnail.url }}
          style={styles.thumbnail}
          accessibilityLabel={`${category.name} thumbnail`}
        />
      ) : (
        <View
          style={[styles.thumbnail, { backgroundColor: theme.colors.primarySoft }]}
          accessibilityLabel={`${category.name} has no thumbnail`}
        >
          <Ionicons name="images-outline" size={20} color={theme.colors.primaryOnSoft} />
        </View>
      )}

      <View style={styles.identity}>
        <View style={styles.topRow}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.name}>
            {category.name}
          </Text>
          <Badge
            label={categoryStatusLabel(category.isActive)}
            tone={categoryStatusTone(category.isActive)}
          />
        </View>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {subtitle}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          Created {formatDate(category.createdAt)}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.iconMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  identity: { flex: 1, gap: spacing.xs, minWidth: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flexShrink: 1 },
});
