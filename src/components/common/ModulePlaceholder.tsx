import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { spacing, radius } from '@/theme';
import type { ModuleDefinition } from '@/navigation/modules';

export interface ModulePlaceholderProps {
  module: ModuleDefinition;
}

/**
 * Temporary scaffold shown by module routes until real feature screens
 * are implemented in later steps. No business logic or mock data.
 */
export function ModulePlaceholder({ module }: ModulePlaceholderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.primarySoft }]}>
        <Ionicons name={module.icon} size={34} color={theme.colors.primaryOnSoft} />
      </View>
      <Text variant="title" align="center">
        {module.label}
      </Text>
      <Text variant="body" tone="muted" align="center">
        This module will be implemented in a later step.
      </Text>
      <View
        style={[
          styles.tag,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text variant="caption" tone="muted">
          permission: {module.permission}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
  },
});
