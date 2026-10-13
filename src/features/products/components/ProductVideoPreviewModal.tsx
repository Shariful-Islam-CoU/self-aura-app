import { Modal, StyleSheet, View } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { formatDuration, resolveMediaUrl } from '../lib/media';
import type { ProductVideo } from '../types';

export interface ProductVideoPreviewModalProps {
  /** The managed video to preview - rendered only while this modal is open. */
  video: ProductVideo;
  onClose: () => void;
}

/**
 * Full-screen video preview (tap the poster in the video manager to open).
 *
 * Playback runs through `expo-video` (bundled in Expo Go for SDK 57) and
 * STREAMS the backend's transcoded MP4 delivery URL directly - nothing is
 * downloaded up front, and no Cloudinary credential is involved: the app
 * only ever holds the safe URL the API returned. The native controls supply
 * play/pause, scrubbing and fullscreen, so no custom control surface is
 * built here. The player lives exactly as long as the modal does - unmount
 * stops playback and releases it.
 *
 * Deliberately no tap-to-dismiss on the video surface: the controls need
 * those taps. Close is the button (and Android's back gesture via
 * `onRequestClose`).
 */
export function ProductVideoPreviewModal({ video, onClose }: ProductVideoPreviewModalProps) {
  const insets = useSafeAreaInsets();
  const source = resolveMediaUrl(video.url);

  const player = useVideoPlayer(source, (instance) => {
    // The user tapped this video specifically, so preview means play.
    instance.play();
  });

  const { status, error } = useEvent(player, 'statusChange', { status: player.status });
  const failed = status === 'error';

  const caption = [video.alt?.trim(), formatDuration(video.duration)].filter(Boolean).join(' · ');

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
