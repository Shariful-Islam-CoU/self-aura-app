import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { IconButton } from './IconButton';
import { useTheme } from '@/providers/ThemeProvider';
import { radius, spacing } from '@/theme';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Optional sheet header title. */
  title?: string;
  /** Hide the header close button (default: shown). */
  showClose?: boolean;
  children: ReactNode;
}

/**
 * Bottom sheet built on the native `Modal` (slide animation, Android
 * hardware-back closes it through `onRequestClose`) - no extra dependency.
 *
 * The scrim, handle bar, rounded top corners and safe-area padding are all
 * themed; content is rendered by the caller (keep lists in a ScrollView).
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  showClose = true,
  children,
}: BottomSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              paddingBottom: insets.bottom + spacing.lg,
            },
            theme.shadows.md,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

          {title || showClose ? (
            <View style={styles.header}>
              {title ? (
                <Text variant="h3" style={styles.title}>
                  {title}
                </Text>
              ) : (
                <View style={styles.title} />
              )}
              {showClose ? (
                <IconButton icon="close" accessibilityLabel="Close sheet" onPress={onClose} />
              ) : null}
            </View>
          ) : null}

          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingRight: spacing.xs,
    paddingBottom: spacing.sm,
  },
  title: {
    flex: 1,
  },
});
