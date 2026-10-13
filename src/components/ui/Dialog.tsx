import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { Button } from './Button';
import { useTheme } from '@/providers/ThemeProvider';
import { radius, spacing } from '@/theme';

export interface DialogAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'success' | 'outline' | 'ghost';
  loading?: boolean;
}

export interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  /** Custom body content (rendered between the message and the actions). */
  children?: ReactNode;
  /** Main action; its `loading` state blocks double confirmations. */
  primaryAction?: DialogAction;
  /** Cancel/back action - only rendered when provided. */
  secondaryAction?: { label: string; onPress?: () => void };
  /** Close when the scrim is tapped (default: true). */
  dismissOnBackdrop?: boolean;
}

/**
 * Centered alert dialog for confirmations ("Delete product?") and short
 * forms. Native `Modal` gives us fade animation and Android hardware-back
 * support (`onRequestClose`) without a dependency.
 */
export function Dialog({
  visible,
  onClose,
  title,
  message,
  children,
  primaryAction,
  secondaryAction,
  dismissOnBackdrop = true,
}: DialogProps) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: theme.colors.overlay }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissOnBackdrop ? onClose : undefined}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
            },
            theme.shadows.lg,
          ]}
        >
          {title ? (
            <Text variant="h3" accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          {message ? (
            <Text variant="body" tone="secondary">
              {message}
            </Text>
          ) : null}
          {children}

          {primaryAction || secondaryAction ? (
            <View style={styles.actions}>
              {secondaryAction ? (
                <Button
                  title={secondaryAction.label}
                  variant="ghost"
                  onPress={secondaryAction.onPress ?? onClose}
                  disabled={primaryAction?.loading}
                  style={styles.action}
                />
              ) : null}
              {primaryAction ? (
                <Button
                  title={primaryAction.label}
                  variant={primaryAction.variant ?? 'primary'}
                  onPress={primaryAction.onPress}
                  loading={primaryAction.loading}
                  style={styles.action}
                />
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  action: {
    flexGrow: 1,
  },
});
