import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getErrorMessage } from '@/api';
import { Divider, SectionHeader, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import {
  useRemoveCategoryBanner,
  useRemoveCategoryThumbnail,
  useUpdateCategory,
  useUploadCategoryBanner,
  useUploadCategoryThumbnail,
} from '../queries';
import type { Category } from '../types';
import { CategoryImageField } from './CategoryImageField';

/**
 * Thumbnail + banner editing for a category, bound to the `categories.edit`
 * media endpoints. The two fields are separate on purpose - thumbnail and
 * banner are distinct images with distinct backend routes - and each backs
 * onto its own upload/remove mutation so a failure in one never blocks the
 * other. Alt-text changes ride the plain PATCH (`thumbnailAlt`/`bannerAlt`)
 * exactly like the web app.
 */
export function CategoryMediaSection({ category }: { category: Category }) {
  const { theme } = useTheme();

  const uploadThumbnail = useUploadCategoryThumbnail(category.id);
  const removeThumbnail = useRemoveCategoryThumbnail(category.id);
  const uploadBanner = useUploadCategoryBanner(category.id);
  const removeBanner = useRemoveCategoryBanner(category.id);
  const saveThumbnailAlt = useUpdateCategory();
  const saveBannerAlt = useUpdateCategory();

  /** Inline success copy per field ("Thumbnail uploaded." etc.). */
  const [thumbnailSuccess, setThumbnailSuccess] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  /**
   * Maps the latest failure, if any, of a field's three mutations into the
   * user-facing string the fields render. NEVER call `getErrorMessage(null)`:
   * it returns a "something went wrong" fallback even when nothing failed.
   */
  const errorMessage = (error: unknown) => (error ? getErrorMessage(error) : null);

  const thumbnailError = errorMessage(
    uploadThumbnail.error ?? removeThumbnail.error ?? saveThumbnailAlt.error,
  );
  const bannerError = errorMessage(uploadBanner.error ?? removeBanner.error ?? saveBannerAlt.error);

  return (
    <View>
      <SectionHeader
        title="Category images"
        subtitle="Optional images used across the storefront"
      />
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <CategoryImageField
          kind="thumbnail"
          categoryId={category.id}
          categoryName={category.name}
          media={category.thumbnail}
          isUploading={uploadThumbnail.isPending}
          isRemoving={removeThumbnail.isPending}
          isSavingAlt={saveThumbnailAlt.isPending}
          error={thumbnailError}
          success={thumbnailSuccess}
          onPick={(image) => {
            setThumbnailSuccess(null);
            uploadThumbnail.mutate(
              { image },
              { onSuccess: () => setThumbnailSuccess('Thumbnail uploaded.') },
            );
          }}
          onRemove={() => {
            setThumbnailSuccess(null);
            removeThumbnail.mutate(undefined, {
              onSuccess: () => setThumbnailSuccess('Thumbnail removed.'),
            });
          }}
          onSaveAlt={(alt) => {
            setThumbnailSuccess(null);
            saveThumbnailAlt.mutate(
              { id: category.id, input: { thumbnailAlt: alt } },
              { onSuccess: () => setThumbnailSuccess('Thumbnail description saved.') },
            );
          }}
        />

        <Divider />

        <CategoryImageField
          kind="banner"
          categoryId={category.id}
          categoryName={category.name}
          media={category.banner}
          isUploading={uploadBanner.isPending}
          isRemoving={removeBanner.isPending}
          isSavingAlt={saveBannerAlt.isPending}
          error={bannerError}
          success={bannerSuccess}
          onPick={(image) => {
            setBannerSuccess(null);
            uploadBanner.mutate(
              { image },
              { onSuccess: () => setBannerSuccess('Banner uploaded.') },
            );
          }}
          onRemove={() => {
            setBannerSuccess(null);
            removeBanner.mutate(undefined, {
              onSuccess: () => setBannerSuccess('Banner removed.'),
            });
          }}
          onSaveAlt={(alt) => {
            setBannerSuccess(null);
            saveBannerAlt.mutate(
              { id: category.id, input: { bannerAlt: alt } },
              { onSuccess: () => setBannerSuccess('Banner description saved.') },
            );
          }}
        />

        <Text variant="caption" tone="muted">
          Images are uploaded through the backend media API - the app never connects to the media
          provider directly.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
});
