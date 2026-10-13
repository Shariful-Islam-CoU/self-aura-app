import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';

import { Card, Chip, Dialog, SectionHeader, Text, pressFeedback } from '@/components/ui';
import { AppHeader, Screen } from '@/components/layout';
import { MODULE_GROUPS, canAccessModule, modulesInGroup } from '@/navigation';
import { useAuth, useTheme, type ThemeMode } from '@/providers';
import { radius, spacing } from '@/theme';
import type { IconName } from '@/types';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/** One tappable entry in a section's 2-column grid. */
interface TileData {
  icon: IconName;
  title: string;
  description?: string;
  onPress: () => void;
}

/**
 * Grid tile used by every More section: tinted icon, title, optional
 * short description. Full 44pt+ touch target, one press-feedback
 * vocabulary shared with the rest of the design system.
 */
function GridTile({ tile }: { tile: TileData }) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tile.description ? `${tile.title}. ${tile.description}` : tile.title}
      onPress={tile.onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border },
        pressFeedback(pressed),
      ]}
    >
      <View style={[styles.tileIcon, { backgroundColor: theme.colors.primarySoft }]}>
        <Ionicons name={tile.icon} size={20} color={theme.colors.primaryOnSoft} />
      </View>
      <View style={styles.tileText}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {tile.title}
        </Text>
        {tile.description ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {tile.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const { canAccess, signOut } = useAuth();
  const { mode, setTheme } = useTheme();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <Screen>
      <AppHeader variant="feature" title="More" />

      {/* Appearance preference: light / dark / system. */}
      <View style={styles.section}>
        <SectionHeader title="Appearance" subtitle="Theme persists across launches" />
        <View style={styles.chipRow}>
          {THEME_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={mode === option.value}
              onPress={() => setTheme(option.value)}
            />
          ))}
        </View>
      </View>

      {/* Module sections: grouped cards with a 2-column tile grid, each
          entry permission-filtered (UX-only - the backend stays the
          authority). Tab-owned modules (Home/Orders/Products/Customers)
          have no group, so they never repeat here. */}
      {MODULE_GROUPS.map((group) => {
        const items = modulesInGroup(group).filter((module) => canAccessModule(module, canAccess));
        if (items.length === 0) return null;

        return (
          <View key={group} style={styles.section}>
            <SectionHeader title={group} />
            <Card>
              <View style={styles.grid}>
                {items.map((module) => (
                  <GridTile
                    key={module.key}
                    tile={{
                      icon: module.icon,
                      title: module.label,
                      description: module.description,
                      // Implemented modules route to their dedicated stack;
                      // the rest keep the generic placeholder route.
                      onPress: () => router.push((module.route ?? `/module/${module.key}`) as Href),
                    }}
                  />
                ))}
              </View>
            </Card>
          </View>
        );
      })}

      {/* Account: own profile route + session logout (local session clear
          only - no business API). */}
      <View style={styles.section}>
        <SectionHeader title="Account" />
        <Card>
          <View style={styles.grid}>
            <GridTile
              tile={{
                icon: 'person-outline',
                title: 'Profile',
                description: 'Your account information',
                onPress: () => router.push('/profile'),
              }}
            />
            <GridTile
              tile={{
                icon: 'log-out-outline',
                title: 'Log out',
                description: 'End this session',
                onPress: () => setConfirmLogout(true),
              }}
            />
          </View>
        </Card>
      </View>

      {/* DEV ONLY - internal design-system showcase (see design-system.tsx).
          Remove this block, the route file and the Tabs.Screen entry in
          (tabs)/_layout.tsx to drop the showcase entirely. */}
      {__DEV__ ? (
        <View style={styles.section}>
          <SectionHeader
            title="Development"
            subtitle="Internal tools - not part of the product UI"
          />
          <Card>
            <View style={styles.grid}>
              <GridTile
                tile={{
                  icon: 'color-palette-outline',
                  title: 'Design system',
                  description: 'Theme, components and navigation showcase',
                  onPress: () => router.push('/design-system'),
                }}
              />
            </View>
          </Card>
        </View>
      ) : null}

      {/* Shell preview removed in Step 6. */}

      <Dialog
        visible={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Log out?"
        message="You will need to sign in again to access the management app."
        secondaryAction={{ label: 'Cancel' }}
        primaryAction={{
          label: 'Log out',
          variant: 'danger',
          onPress: () => {
            setConfirmLogout(false);
            void signOut();
          },
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 64,
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    flex: 1,
    gap: 2,
  },
  preview: {
    gap: spacing.sm,
  },
});
