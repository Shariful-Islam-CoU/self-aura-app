import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getErrorMessage } from '@/api';
import { Button, Card, IconButton, Input, Text } from '@/components/ui';
import { useUpdateProductVideos, useUploadProductVideo } from '@/features/products/queries';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import {
  ACCEPTED_VIDEO_FORMATS_LABEL,
  ACCEPTED_VIDEO_MIME_TYPES,
  MAX_PRODUCT_VIDEOS,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_UPLOAD_LABEL,
  formatDuration,
  moveDown,
  moveUp,
  removeAt,
  resolveMediaUrl,
  withAltAt,
} from '../lib/media';
import { pickProductVideos } from '../lib/mediaPicker';
import type { PickedMediaFile, Product, ProductVideo } from '../types';
import { MediaUploadProgress, type UploadProgressState } from './MediaUploadProgress';
import { ProductVideoPreviewModal } from './ProductVideoPreviewModal';

/**
 * Staged video editor for one product - the same workflow as the image
 * manager: multi-file selection queued as one-file-per-request uploads
 * (the backend's upload contract), per-file failure reporting with a
 * retry for exactly the failed files, and reorder/alt/removal staged until
 * one atomic `PUT /videos/order`. There is no "primary" action because the
 * backend has no primary concept for videos.
 *
 * Tapping a poster opens the full-screen preview modal, which STREAMS the
 * backend's transcoded URL through `expo-video` - rows themselves never
 * mount a player, so a list of videos costs nothing but poster frames.
 * Posters shown here are the `thumbnailUrl` the backend delivered, as-is.
 */
export function ProductVideoManager({ product }: { product: Product }) {
  const { theme } = useTheme();

  const upload = useUploadProductVideo(product.id);
  const saveOrder = useUpdateProductVideos(product.id);

  /** Staged edits; `null` = nothing unsaved (render the server list). */
  const [draft, setDraft] = useState<ProductVideo[] | null>(null);
  const [progress, setProgress] = useState<UploadProgressState | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  /** Files from the last queue run that failed - re-sent verbatim on retry. */
  const [retryFiles, setRetryFiles] = useState<PickedMediaFile[] | null>(null);
  const [preview, setPreview] = useState<ProductVideo | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const list = draft ?? product.videos;
  const dirty = draft !== null;
  const atLimit = list.length >= MAX_PRODUCT_VIDEOS;

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
        `${uploaded} video${uploaded > 1 ? 's' : ''} uploaded and stored in the media library.`,
      );
    }
  };

  const handleUpload = async () => {
    if (busy) return;
    // The ceiling is the SERVER count, not the staged one: a staged removal
    // that has not been committed must not let an upload over the limit
    // through (same rule the web manager applies to `savedVideos`).
    const remaining = MAX_PRODUCT_VIDEOS - product.videos.length;
    if (remaining <= 0) return;

    const picked = await pickProductVideos(remaining);
    if (!picked.ok) {
      setMessage(null);
      setLocalError(
        picked.reason === 'denied' ? 'Photo library access is required to choose a video.' : null,
      );
      return;
    }

    const files = picked.files;
    const typeOk = (file: PickedMediaFile) =>
      (ACCEPTED_VIDEO_MIME_TYPES as readonly string[]).includes(file.type);
    const tooLarge = (file: PickedMediaFile) =>
      typeof file.size === 'number' && file.size > MAX_VIDEO_BYTES;

    const badType = files.filter((file) => !typeOk(file));
    const oversized = files.filter((file) => typeOk(file) && tooLarge(file));
    const good = files.filter((file) => typeOk(file) && !tooLarge(file));

    const notes: string[] = [];
    if (badType.length > 0) {
      notes.push(
        badType.length === files.length
          ? `Only ${ACCEPTED_VIDEO_FORMATS_LABEL} videos can be uploaded.`
          : `${badType.length} file${badType.length > 1 ? 's were' : ' was'} skipped: only ${ACCEPTED_VIDEO_FORMATS_LABEL} are supported.`,
      );
    }
    if (oversized.length > 0) {
      notes.push(
        `${oversized.length} file${oversized.length > 1 ? 's were' : ' was'} skipped: videos must be ${MAX_VIDEO_UPLOAD_LABEL} or smaller.`,
      );
    }

    const queue = good.slice(0, Math.max(0, remaining));
    if (queue.length < good.length) {
      notes.push(
        `A product may have at most ${MAX_PRODUCT_VIDEOS} videos; ${good.length - queue.length} file(s) were not uploaded.`,
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
      { videos: list.map((video) => ({ key: video.key, alt: video.alt })) },
      {
        onSuccess: () => {
          setDraft(null);
          setMessage('Video order and alt text saved.');
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
          <Text variant="title">Videos</Text>
          <Text variant="caption" tone="muted">
            {list.length}/{MAX_PRODUCT_VIDEOS}
            {dirty ? ' · unsaved' : ''} · tap a poster to preview
          </Text>
        </View>
        <Button
          title="Upload video"
          icon="videocam-outline"
          size="sm"
          onPress={() => void handleUpload()}
          loading={isUploading}
          disabled={atLimit || saveOrder.isPending}
          accessibilityLabel="Choose product videos to upload"
        />
      </View>

      {progress ? <MediaUploadProgress {...progress} /> : null}

      {atLimit ? (
        <Text variant="caption" tone="muted">
          A product may have at most {MAX_PRODUCT_VIDEOS} videos — remove one to upload another.
        </Text>
      ) : null}

      {list.length === 0 ? (
        <Text variant="bodySmall" tone="muted">
          No videos yet. Upload a short clip to show this product in motion.
        </Text>
      ) : (
        <View style={styles.rows}>
          {list.map((video, index) => {
            const posterUri = resolveMediaUrl(video.thumbnailUrl);
            const duration = formatDuration(video.duration);
            return (
              <View key={video.key} style={styles.row}>
                <Pressable
                  onPress={() => setPreview(video)}
                  accessibilityRole="button"
                  accessibilityLabel={`Preview video ${index + 1}${video.alt ? `: ${video.alt}` : ''}`}
                  style={({ pressed }) => [
                    styles.thumb,
                    { backgroundColor: theme.colors.surfaceMuted },
                    pressed && { opacity: 0.72 },
                  ]}
                >
                  {posterUri ? (
                    <Image
                      source={{ uri: posterUri }}
                      style={styles.thumbImage}
                      resizeMode="cover"
                      accessibilityLabel={video.alt || `Poster frame for video ${index + 1}`}
                    />
                  ) : (
                    <View style={styles.fallback} accessibilityElementsHidden>
                      <Ionicons name="film-outline" size={24} color={theme.colors.iconMuted} />
                    </View>
                  )}
                  <View
                    style={styles.playOverlay}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    <Ionicons name="play-circle" size={26} color="rgba(255, 255, 255, 0.92)" />
                  </View>
                </Pressable>

                <View style={styles.rowBody}>
                  <Input
                    label={`Video ${index + 1} alt text`}
                    value={video.alt}
                    onChangeText={(text) => {
                      beforeEdit();
                      setDraft(withAltAt(list, index, text));
                    }}
                    placeholder="Describe the video for screen readers"
                    maxLength={200}
                    editable={!busy}
                    helperText={
                      [video.mimeType, duration ? formatDuration(video.duration) : undefined]
                        .filter(Boolean)
                        .join(' · ') || undefined
                    }
                    accessibilityLabel={`Alt text for product video ${index + 1}`}
                  />
                  <View style={styles.controls}>
                    <IconButton
                      icon="chevron-up"
                      accessibilityLabel={`Move video ${index + 1} up`}
                      disabled={index === 0 || busy}
                      onPress={() => {
                        beforeEdit();
                        setDraft(moveUp(list, index));
                      }}
                    />
                    <IconButton
                      icon="chevron-down"
                      accessibilityLabel={`Move video ${index + 1} down`}
                      disabled={index === list.length - 1 || busy}
                      onPress={() => {
                        beforeEdit();
                        setDraft(moveDown(list, index));
                      }}
                    />
                    <View style={styles.spacer} />
                    <IconButton
                      icon="trash-outline"
                      accessibilityLabel={`Remove video ${index + 1}`}
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
            title="Save videos"
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
        {ACCEPTED_VIDEO_FORMATS_LABEL}, up to {MAX_VIDEO_UPLOAD_LABEL} each. Playback streams from
        the backend; nothing is edited or re-encoded on the device. Reorder and removals are saved
        together, so the whole list is validated before anything changes.
      </Text>

      {preview ? (
        <ProductVideoPreviewModal video={preview} onClose={() => setPreview(null)} />
      ) : null}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: { width: '100%', height: '100%' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  playOverlay: {
    position: 'absolute',
    right: 2,
    bottom: 2,
  },
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
