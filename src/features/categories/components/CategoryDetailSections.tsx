import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { formatDate } from '@/utils/format';
import { categoryStatusLabel, categoryStatusTone, mediaStorageLabel } from '../labels';
import type { Category, CategoryImage } from '../types';
import { DetailRow, SectionCard } from './SectionCard';

/** Backend fields for one category: name, slug, description, status, dates. */
export function CategoryOverviewSection({ category }: { category: Category }) {
  return (
    <SectionCard title="Overview">
      <DetailRow label="Name" value={category.name} />
      <DetailRow label="Slug" value={`/${category.slug}`} />
      <DetailRow label="Description" value={category.description || '—'} />
      <DetailRow label="Status">
        <Badge
          label={categoryStatusLabel(category.isActive)}
          tone={categoryStatusTone(category.isActive)}
        />
      </DetailRow>
      <DetailRow label="Created" value={formatDate(category.createdAt)} />
      <DetailRow label="Last updated" value={formatDate(category.updatedAt)} />
    </SectionCard>
  );
}

/** Read-only thumbnail/banner preview used on the details screen. */
export function CategoryMediaPreviewSection({ category }: { category: Category }) {
  return (
    <SectionCard title="Images">
      <MediaPreviewRow label="Thumbnail" image={category.thumbnail} fallback="No thumbnail set." />
      <MediaPreviewRow label="Banner" image={category.banner} fallback="No banner set." />
    </SectionCard>
  );
}

function MediaPreviewRow({
  label,
  image,
  fallback,
}: {
  label: string;
  image: CategoryImage | null;
  fallback: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.row}>
      {image ? (
        <Image
          source={{ uri: image.url }}
          style={styles.thumb}
          accessibilityLabel={`${label} image`}
        />
      ) : (
        <View
          style={[styles.thumb, styles.thumbEmpty, { backgroundColor: theme.colors.surfaceMuted }]}
        >
          <Ionicons name="image-outline" size={18} color={theme.colors.iconMuted} />
        </View>
      )}
      <View style={styles.meta}>
        <Text variant="bodyMedium">{label}</Text>
        <View style={styles.metaLine}>
          {image ? <Badge label={mediaStorageLabel(image.managed)} tone="neutral" /> : null}
          <Text variant="caption" tone="muted" numberOfLines={2} style={styles.flexText}>
            {image?.alt || fallback}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: radius.md },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  meta: { flex: 1, gap: spacing.xs, minWidth: 0 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flexText: { flex: 1 },
});
