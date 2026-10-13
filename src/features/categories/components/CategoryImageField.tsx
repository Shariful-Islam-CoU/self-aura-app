import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge, Button, Input, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import { pickCategoryImage } from '../lib/imagePicker';
import { mediaStorageLabel } from '../labels';
import type { CategoryImage, PickedCategoryImage } from '../types';
import { CategoryImagePreview } from './CategoryImagePreview';

/** Which of the two category images this field manages. */
export type CategoryImageKind = 'thumbnail' | 'banner';

export interface CategoryImageFieldProps {
  kind: CategoryImageKind;
  categoryId: string;
  categoryName: string;
  /** Current image, or `null` when the category has none. */
  media: CategoryImage | null;
  isUploading: boolean;
  isRemoving: boolean;
  isSavingAlt: boolean;
  /** Latest error from the owning mutation, shown under the control. */
  error: string | null;
  /** Latest success from the owning mutation (upload/remove/alt save). */
  success: string | null;
  onPick: (image: PickedCategoryImage) => void;
  onRemove: () => void;
  onSaveAlt: (alt: string) => void;
}

const COPY = {
  thumbnail: {
    title: 'Category thumbnail',
    subtitle: 'Small image shown with the category in lists.',
    empty:
      'No thumbnail. Without one, the storefront falls back to a branded placeholder for this category.',
    altInput: 'Alt text for the category thumbnail',
    altPlaceholder: 'Describe the thumbnail for screen readers',
    pickerLabel: 'Choose a category thumbnail to upload',
    successUpload: 'Thumbnail uploaded.',
    successRemove: 'Thumbnail removed.',
    successAlt: 'Thumbnail description saved.',
  },
  banner: {
    title: 'Category banner',
    subtitle: 'Used for large homepage category banner.',
    empty: 'No banner. Categories without banners are skipped from the homepage carousel.',
    altInput: 'Alt text for the category banner',
    altPlaceholder: 'Describe the banner for screen readers',
    pickerLabel: 'Choose a category banner to upload',
    successUpload: 'Banner uploaded.',
    successRemove: 'Banner removed.',
    successAlt: 'Banner description saved.',
  },
} as const;

const MAX_ALT_LENGTH = 200;

/** The ALT_MAX mirror - 200 characters matches the backend validator. */
const ALT_MAX = MAX_ALT_LENGTH;

/**
 * One optional category image (thumbnail or banner) - the two are separate
 * media fields with separate backend endpoints (`/:id/thumbnail`, `/:id/banner`)
 * and are never conflated. Mirrors the web manager:
 *
 *   - current image always visible, so "replace" is never a blind action
 *   - alt text editable without re-uploading (a plain PATCH)
 *   - at most one image; uploading a new one replaces it and removes the
 *     previous file from the media library (managed) - handled by the backend
 *   - removal is direct, exactly like the web (no intermediate step)
 *
 * Files are picked with the system library picker and uploaded through the
 * authenticated backend media API only - no Cloudinary credentials exist in
 * the app. Loading states cover upload, removal and alt-save; intermediate
 * failures show the backend's own message.
 */
export function CategoryImageField({
  kind,
  categoryName,
  media,
  isUploading,
  isRemoving,
  isSavingAlt,
  error,
  success,
  onPick,
  onRemove,
  onSaveAlt,
}: CategoryImageFieldProps) {
  const { theme } = useTheme();
  const copy = COPY[kind];

  const [altDraft, setAltDraft] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const displayedAlt = altDraft ?? media?.alt ?? '';
  const altUntouched = altDraft === null;
  const canSaveAlt =
    Boolean(media) && !isSavingAlt && !altUntouched && altDraft.trim() !== (media?.alt ?? '');

  const busy = isUploading || isRemoving || isSavingAlt;

  const handlePick = async () => {
    setLocalError(null);
    const result = await pickCategoryImage();
    if (!result.ok) {
      if (result.reason === 'denied') {
        setLocalError('Photo library access is required to choose an image.');
      } else if (result.reason === 'unsupported') {
        setLocalError('Only JPEG, PNG and WebP images can be uploaded.');
      }
      return;
    }
    onPick(result.image);
  };

  const handleRemove = () => {
    setLocalError(null);
    onRemove();
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text variant="subtitle">{copy.title}</Text>
          <Text variant="caption" tone="muted">
            {copy.subtitle}
          </Text>
        </View>
        {media ? <Badge label={mediaStorageLabel(media.managed)} tone="neutral" /> : null}
        <Button
          variant="outline"
          size="sm"
          title={media ? 'Replace' : 'Upload'}
          icon="cloud-upload-outline"
          loading={isUploading}
          disabled={isUploading || isRemoving}
          onPress={() => void handlePick()}
          accessibilityLabel={media ? `Replace ${copy.title.toLowerCase()}` : copy.pickerLabel}
        />
      </View>

      {error || localError ? (
        <View style={[styles.banner, { backgroundColor: theme.colors.dangerSoft }]}>
          <Text variant="bodySmall" style={{ color: theme.colors.dangerOnSoft }}>
            {error ?? localError}
          </Text>
        </View>
      ) : null}

      {success ? (
        <View style={[styles.banner, { backgroundColor: theme.colors.successSoft }]}>
          <Text variant="bodySmall" style={{ color: theme.colors.successOnSoft }}>
            {success}
          </Text>
        </View>
      ) : null}

      {media ? (
        <View style={[styles.mediaRow, { borderColor: theme.colors.border }]}>
          <Pressable
            onPress={() => setPreviewUri(media.url)}
            accessibilityRole="imagebutton"
            accessibilityLabel={`Preview ${copy.title.toLowerCase()}`}
          >
            <Image source={{ uri: media.url }} style={styles.preview} />
          </Pressable>

          <View style={styles.mediaMeta}>
            <Input
              label={copy.altInput}
              value={displayedAlt}
              onChangeText={(text) => setAltDraft(text)}
              placeholder={copy.altPlaceholder}
              maxLength={ALT_MAX}
              editable={!busy}
              helperText={`${ALT_MAX} characters max`}
            />
            <View style={styles.actions}>
              <Button
                variant="ghost"
                size="sm"
                title="Save description"
                loading={isSavingAlt}
                disabled={!canSaveAlt}
                onPress={() => {
                  // `canSaveAlt` already proved `altDraft` non-null, but TS
                  // cannot connect the boolean to this closure - guard again.
                  if (altDraft !== null) onSaveAlt(altDraft.trim());
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                title="Remove"
                icon="trash-outline"
                loading={isRemoving}
                disabled={isUploading || isRemoving}
                onPress={handleRemove}
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.emptyBox, { borderColor: theme.colors.border }]}>
          <Ionicons name="image-outline" size={22} color={theme.colors.iconMuted} />
          <Text variant="bodySmall" tone="muted" style={styles.emptyText}>
            {copy.empty}
          </Text>
        </View>
      )}

      <Text variant="caption" tone="muted">
        JPEG, PNG or WebP. A category has at most one {kind}; uploading a new one replaces it and
        removes the previous file from the media library.
      </Text>

      <CategoryImagePreview
        uri={previewUri}
        alt={media?.alt ?? `${categoryName} ${copy.title.toLowerCase()}`}
        onClose={() => setPreviewUri(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  titleBlock: { flex: 1, gap: 2, minWidth: 0 },
  banner: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  mediaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  preview: { width: 72, height: 72, borderRadius: radius.md },
  mediaMeta: { flex: 1, gap: spacing.sm, minWidth: 0 },
  actions: { flexDirection: 'row', justifyContent: 'flex-start', gap: spacing.sm },
  emptyBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyText: { textAlign: 'center' },
});
