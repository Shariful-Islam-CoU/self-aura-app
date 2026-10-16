import { Alert, ActivityIndicator, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import { IconButton } from '@/components/ui';
import { spacing } from '@/theme';
import { saveRemoteMediaToLibrary } from '../lib/saveMedia';

export interface ProductMediaPreviewModalProps {
  /** Image URL to preview, or `null` to hide the modal. */
  uri: string | null;
  /** Accessible alternative text for the image. */
  alt: string;
  onClose: () => void;
}

/**
 * Full-screen image preview with download capability.
 * Tap anywhere or use the close button to dismiss.
 * Long press or tap the download button to save to device.
 */
export function ProductMediaPreviewModal({ uri, alt, onClose }: ProductMediaPreviewModalProps) {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  const saveImage = async () => {
    if (!uri) return;

    setSaving(true);
    const result = await saveRemoteMediaToLibrary(uri, 'image');
    setSaving(false);

    if (result.ok) {
      Alert.alert('Saved', 'Image saved to your photo library.');
    } else if (result.reason === 'permission') {
      Alert.alert(
        'Permission required',
        'Allow photo access in your device settings to save images.',
      );
    } else if (result.reason === 'unavailable') {
      Alert.alert(
        'Update required',
        'Saving to the gallery needs a rebuilt app. Update Self Aura and try again.',
      );
    } else {
      Alert.alert('Could not save', 'The image could not be downloaded. Please try again.');
    }
  };

  return (
    <Modal
      visible={Boolean(uri)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable
        style={styles.scrim}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close image preview"
      >
        <View style={[styles.closeButton, { top: insets.top + spacing.lg }]}>
          <IconButton
            icon="close"
            accessibilityLabel="Close image preview"
            onPress={onClose}
            filled
          />
          {!saving && uri && (
            <IconButton
              icon="download-outline"
              accessibilityLabel="Download image"
              onPress={saveImage}
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
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={alt}
          />
        ) : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
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
  image: {
    width: '100%',
    height: '80%',
  },
});