import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { TABS, canAccessTab } from '@/navigation';
import { useAuth, useTheme } from '@/providers';
import { radius, spacing } from '@/theme';

/**
 * Bottom tab bar of the authenticated shell.
 *
 * Five tabs maximum (platform guidance); visibility is permission-filtered
 * through the same UX-only snapshot as the web sidebar. The "More" tab has
 * no permission requirement, so there is always at least one visible tab and
 * the guard redirect never dead-ends.
 *
 * Visual language: quiet surface + hairline top border, and an active state
 * that reads as a soft primary pill behind the icon (premium, no heavy
 * highlight blocks). The dev-only `design-system` route is registered with
 * `href: null`: it renders INSIDE this shell (so the showcase shows the real
 * tab bar) without appearing as a sixth tab.
 */
export default function TabsLayout() {
  const { canAccess } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.iconMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingVertical: spacing.xs,
          height: 64 + insets.bottom,
          paddingBottom: spacing.xs + insets.bottom,
        },
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Protected key={tab.route} guard={canAccessTab(tab, canAccess)}>
          <Tabs.Screen
            name={tab.route}
            options={{
              title: tab.label,
              tabBarLabel: tab.label,
              tabBarIcon: ({ focused }) => (
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={focused ? tab.icon : tab.iconOutline}
                    size={24}
                    color={focused ? theme.colors.primary : theme.colors.iconMuted}
                  />
                </View>
              ),
            }}
          />
        </Tabs.Protected>
      ))}

      {/* DEV ONLY - remove together with the showcase screen + More link. */}
      <Tabs.Screen
        name="design-system"
        options={{ href: null, title: 'Design System', tabBarLabel: 'Design System' }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    marginBottom: 2,
  },
});
