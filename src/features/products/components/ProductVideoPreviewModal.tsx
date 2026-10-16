import { Alert, ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import { IconButton, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { formatDuration, resolveMediaUrl } from '../lib/media';
import { saveRemoteMediaToLibrary } from '../lib/saveMedia';
import type { ProductVideo } from '../types';

export interface ProductVideoPreviewModalProps {
  /** The managed video to preview - rendered only while this modal is open. */
  video: ProductVideo;
  onClose: () => void;
}

/**
 * Full-screen video preview with download capability.
 * 
 * Playback runs through `expo-video` (bundled in Expo Go for SDK 57) and
 * STREAMS the backend's transcoded MP4 delivery URL directly - nothing is
 * downloaded up front, and no Cloudinary credential is involved: the app
 * only ever holds the safe URL the API returned. The native controls supply
 * play/pause, scrubbing and fullscreen, so no custom control surface is
 * built here. The player lives exactly as long as the modal does - unmount
 * stops playback and releases it.
 *
 * Tap the download button to save video to device's photo library.
 */
export function ProductVideoPreviewModal({ video, onClose }: ProductVideoPreviewModalProps) {
  const insets = useSafeAreaInsets();
  const videoSource = resolveMediaUrl(video.url) ?? '';
  const [saving, setSaving] = useState(false);

  const player = useVideoPlayer(videoSource, (instance) => {
    instance.play();
  });

  const { status, error } = useEvent(player, 'statusChange', { status: player.status });
  const failed = status === 'error';

  const caption = [video.alt?.trim(), formatDuration(video.duration)].filter(Boolean).join(' · ');

  const saveVideo = async () => {
    if (!videoSource) return;

    setSaving(true);
    const result = await saveRemoteMediaToLibrary(videoSource, 'video');
    setSaving(false);

    if (result.ok) {
      Alert.alert('Saved', 'Video saved to your photo library.');
    } else if (result.reason === 'permission') {
      Alert.alert(
        'Permission required',
        'Allow video access in your device settings to save videos.',
      );
    } else if (result.reason === 'unavailable') {
      Alert.alert(
        'Update required',
        'Saving to the gallery needs a rebuilt app. Update Self Aura and try again.',
      );
    } else {
      Alert.alert('Could not save', 'The video could not be downloaded. Please try again.');
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.scrim}>
        <View style={[styles.closeButton, { top: insets.top + spacing.lg }]}>
          <IconButton
            icon="close"
            accessibilityLabel="Close video preview"
            onPress={onClose}
            filled
          />
          {!saving && (
            <IconButton
              icon="download-outline"
              accessibilityLabel="Download video"
              onPress={saveVideo}
              filled
              style={styles.downloadButton}
            />
          )}
          {saving && (
            <View style={styles.downloadButton}>
              <ActivityIndicator color="#fff" size="small" />
            </View>
          )}
        </View>

        <View style={styles.stage}>
          {failed ? (
            <View style={styles.errorBox}>
              <Text variant="bodyMedium" style={styles.errorTitle} role="alert">
                This video could not be played.
              </Text>
              <Text variant="caption" style={styles.errorDetail}>
                {error?.message
                  ? `${error.message} Check your connection and try again.`
                  : 'Check your connection and try again.'}
              </Text>
            </View>
          ) : (
            <VideoView
              player={player}
              style={styles.video}
              contentFit="contain"
              fullscreenOptions={{ enable: true }}
              accessibilityLabel={video.alt?.trim() || 'Product video preview'}
            />
          )}
        </View>

        {caption ? (
          <Text variant="caption" style={styles.caption} align="center">
            {caption}
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 1,
  },
  downloadButton: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg + 50,
    zIndex: 1,
  },
  stage: {
    width: '100%',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  errorBox: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  errorTitle: {
    color: '#fff',
    textAlign: 'center',
  },
  errorDetail: {
    color: 'rgba(255, 255, 255, 0.72)',
    textAlign: 'center',
  },
  caption: {
    marginTop: spacing.md,
    color: 'rgba(255, 255, 255, 0.85)',
  },
});