import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { getErrorMessage } from '@/api';
import { Button, Card, IconButton, Input, Text } from '@/components/ui';
import { useUpdateProductImages, useUploadProductImage } from '@/features/products/queries';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import {
  ACCEPTED_IMAGE_FORMATS_LABEL,
  ACCEPTED_IMAGE_MIME_TYPES,
  mediaImageSource,
  moveDown,
  moveToTop,
  moveUp,
  removeAt,
  resolveMediaUrl,
  withAltAt,
} from '../lib/media';
import { pickProductImages } from '../lib/mediaPicker';
import type { PickedMediaFile, Product, ProductImage } from '../types';
import { MediaUploadProgress, type UploadProgressState } from './MediaUploadProgress';
import { ProductMediaPreviewModal } from './ProductMediaPreviewModal';

/**
 * Staged image editor for one product (web-parity workflow):
 *
 * - Uploads are one-file-per-request through the backend media API (the
 *   server accepts a single file per request, so a multi-file selection is
 *   queued SEQUENTIALLY - each upload is its own transaction and one
 *   rejected file never aborts the rest). The server uploads the bytes and
 *   commits the reference, then returns the FULL managed list, so the
 *   product cache is refreshed from that response (never re-assembled
 *   locally).
 * - Reordering, alt-text and removals are staged in a local draft and
 *   committed atomically with one `PUT /images/order` - the backend
 *   validates the submitted list before anything changes. Removals are
 *   therefore only ever executed by an explicit "Save images".
 * - Failed files keep their queue entry so "Try again" re-sends exactly
 *   those files; successes are reported and never faked.
 *
 * No Cloudinary credentials exist in the app: uploads always go through the
 * authenticated backend endpoints.
 */
export function ProductImageManager({ product }: { product: Product }) {
  const { theme } = useTheme();

  const upload = useUploadProductImage(product.id);
  const saveOrder = useUpdateProductImages(product.id);

  /** Staged edits; `null` = nothing unsaved (render the server list). */
  const [draft, setDraft] = useState<ProductImage[] | null>(null);
  const [progress, setProgress] = useState<UploadProgressState | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  /** Files from the last queue run that failed - re-sent verbatim on retry. */
  const [retryFiles, setRetryFiles] = useState<PickedMediaFile[] | null>(null);
  const [preview, setPreview] = useState<ProductImage | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const list = draft ?? product.images;
  const dirty = draft !== null;

  const saveError = saveOrder.error ? getErrorMessage(saveOrder.error) : null;
  const errorMessage = saveError ?? localError;
  const busy = isUploading || saveOrder.isPending;

  /**
   * Uploads a queue of files sequentially. Each file is its own backend
   * transaction; failures are collected (with their file name) while the
   * rest of the queue keeps going, then reported together. The server's
   * response to each success already refreshed the product cache, so only
   * the summary and any failures remain to be set afterwards.
   */
  const runUploads = async (files: PickedMediaFile[], baseNotes: string[] = []) => {
    setRetryFiles(null);
    setMessage(null);
    setLocalError(null);
    setIsUploading(true);

    const failed: PickedMediaFile[] = [];
    const failureMessages: string[] = [];
    let uploaded = 0;

    try {
      // Sequential on purpose: one bad file must not poison the batch, and
      // the backend accepts one file per request.
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setProgress({ current: index + 1, total: files.length, fileName: file.name });
        try {
          await upload.mutateAsync({ file });
          uploaded += 1;
        } catch (error) {
          failed.push(file);
          failureMessages.push(`${file.name}: ${getErrorMessage(error)}`);
        }
      }
    } finally {
      setProgress(null);
      setIsUploading(false);
    }

    const notes = [...baseNotes, ...failureMessages];
    setLocalError(notes.length > 0 ? notes.join('\n') : null);
    if (failed.length > 0) setRetryFiles(failed);
    if (uploaded > 0) {
      setMessage(
        `${uploaded} image${uploaded > 1 ? 's' : ''} uploaded and stored in the media library.`,
      );
    }
  };

  const handleUpload = async () => {
    if (busy) return;

    // No selection limit: the picker opens with the system maximum, and there
    // is no per-product count cap on the server either.
    const picked = await pickProductImages();
    if (!picked.ok) {
      setMessage(null);
      setLocalError(
        picked.reason === 'denied' ? 'Photo library access is required to choose an image.' : null,
      );
      return;
    }

    const files = picked.files;
    const typeOk = (file: PickedMediaFile) =>
      (ACCEPTED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type);

    const badType = files.filter((file) => !typeOk(file));
    const queue = files.filter(typeOk);

    const notes: string[] = [];
    if (badType.length > 0) {
      notes.push(
        badType.length === files.length
          ? `Only ${ACCEPTED_IMAGE_FORMATS_LABEL} images can be uploaded.`
          : `${badType.length} file${badType.length > 1 ? 's were' : ' was'} skipped: only ${ACCEPTED_IMAGE_FORMATS_LABEL} are supported.`,
      );
    }

    if (queue.length === 0) {
      setMessage(null);
      setLocalError(notes.length > 0 ? notes.join(' ') : null);
      return;
    }

    await runUploads(queue, notes);
  };

  const handleSave = () => {
    setMessage(null);
    setLocalError(null);
    saveOrder.mutate(
      { images: list.map((image) => ({ key: image.key, alt: image.alt })) },
      {
        onSuccess: () => {
          setDraft(null);
          setMessage('Image order and alt text saved.');
        },
      },
    );
  };

  const handleDiscard = () => {
    setDraft(null);
    setMessage(null);
    setLocalError(null);
    setRetryFiles(null);
  };

  const beforeEdit = () => {
    setMessage(null);
    setLocalError(null);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="title">Images</Text>
          <Text variant="caption" tone="muted">
            {list.length} image{list.length === 1 ? '' : 's'}
            {dirty ? ' · unsaved' : ''} · the first image is primary
          </Text>
        </View>
        <Button
          title="Upload image"
          icon="image-outline"
          size="sm"
          onPress={() => void handleUpload()}
          loading={isUploading}
          disabled={saveOrder.isPending}
          accessibilityLabel="Choose product images to upload"
        />
      </View>

      {progress ? <MediaUploadProgress {...progress} /> : null}

      {list.length === 0 ? (
        <Text variant="bodySmall" tone="muted">
          No images yet. Upload a photo so this product appears with imagery in the storefront.
        </Text>
      ) : (
        <View style={styles.rows}>
          {list.map((image, index) => {
            const thumbUri = mediaImageSource(image.url, 192);
            return (
              <View key={image.key} style={styles.row}>
                <Pressable
                  onPress={() => setPreview(image)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`Preview ${image.alt || `product image ${index + 1}`}`}
                  style={({ pressed }) => [
                    styles.thumb,
                    { backgroundColor: theme.colors.surfaceMuted },
                    pressed && { opacity: 0.72 },
                  ]}
                >
                  {thumbUri ? (
                    <Image
                      source={{ uri: thumbUri }}
                      style={styles.thumbImage}
                      resizeMode="cover"
                      accessibilityLabel={image.alt || `Product image ${index + 1}`}
                    />
                  ) : null}
                </Pressable>

                <View style={styles.rowBody}>
                  <Input
                    label={index === 0 ? 'Primary image alt text' : `Image ${index + 1} alt text`}
                    value={image.alt}
                    onChangeText={(text) => {
                      beforeEdit();
                      setDraft(withAltAt(list, index, text));
                    }}
                    placeholder="Describe the image for screen readers"
                    maxLength={200}
                    editable={!busy}
                    helperText={
                      [
                        image.mimeType,
                        image.width && image.height ? `${image.width}×${image.height}` : undefined,
                      ]
                        .filter(Boolean)
                        .join(' · ') || undefined
                    }
                    accessibilityLabel={`Alt text for product image ${index + 1}`}
                  />
                  <View style={styles.controls}>
                    <IconButton
                      icon="chevron-up"
                      accessibilityLabel={`Move image ${index + 1} up`}
                      disabled={index === 0 || busy}
                      onPress={() => {
                        beforeEdit();
                        setDraft(moveUp(list, index));
                      }}
                    />
                    <IconButton
                      icon="chevron-down"
                      accessibilityLabel={`Move image ${index + 1} down`}
                      disabled={index === list.length - 1 || busy}
                      onPress={() => {
                        beforeEdit();
                        setDraft(moveDown(list, index));
                      }}
                    />
                    {index > 0 ? (
                      <Button
                        title="Primary"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onPress={() => {
                          beforeEdit();
                          setDraft(moveToTop(list, index));
                        }}
                      />
                    ) : null}
                    <View style={styles.spacer} />
                    <IconButton
                      icon="trash-outline"
                      accessibilityLabel={`Remove image ${index + 1}`}
                      disabled={busy}
                      onPress={() => {
                        beforeEdit();
                        setDraft(removeAt(list, index));
                      }}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {dirty ? (
        <View style={styles.footer}>
          <Button
            variant="outline"
            title="Discard changes"
            onPress={handleDiscard}
            disabled={busy}
            style={styles.flex}
          />
          <Button
            variant="primary"
            title="Save images"
            loading={saveOrder.isPending}
            onPress={handleSave}
            style={styles.flex}
          />
        </View>
      ) : null}

      {message ? (
        <Text
          variant="bodySmall"
          style={[styles.message, { color: theme.colors.success }]}
          role="status"
        >
          {message}
        </Text>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorBlock}>
          <Text variant="bodySmall" style={{ color: theme.colors.danger }} role="alert">
            {errorMessage}
          </Text>
          {retryFiles && retryFiles.length > 0 && !saveError ? (
            <Button
              title={`Try again (${retryFiles.length})`}
              variant="outline"
              size="sm"
              onPress={() => void runUploads(retryFiles)}
              style={styles.retry}
            />
          ) : null}
        </View>
      ) : null}

      <Text variant="caption" tone="muted">
        {ACCEPTED_IMAGE_FORMATS_LABEL}, no limit on count or file size. Reorder, alt-text edits and
        removals are saved together, so the whole list is validated before anything changes.
      </Text>

      <ProductMediaPreviewModal
        uri={resolveMediaUrl(preview?.url) ?? null}
        alt={preview?.alt ?? ''}
        onClose={() => setPreview(null)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerText: { flex: 1, gap: 2 },
  rows: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  rowBody: { flex: 1, gap: spacing.xs },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  spacer: { flex: 1 },
  footer: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  message: {},
  errorBlock: { gap: spacing.xs },
  retry: { alignSelf: 'flex-start' },
});
