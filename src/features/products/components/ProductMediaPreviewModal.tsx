import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui';
import { spacing } from '@/theme';

export interface ProductMediaPreviewModalProps {
  /** Image URL to preview, or `null` to hide the modal. */
  uri: string | null;
  /** Accessible alternative text for the image. */
  alt: string;
  onClose: () => void;
}

/**
 * Minimal full-screen media preview (tap anywhere or use the close button to
 * dismiss). Deliberately simple - product management is not a gallery - and
 * modal-specific chrome stays out of the feature screens.
 */
export function ProductMediaPreviewModal({ uri, alt, onClose }: ProductMediaPreviewModalProps) {
  const insets = useSafeAreaInsets();

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
  image: {
    width: '100%',
    height: '80%',
  },
});
