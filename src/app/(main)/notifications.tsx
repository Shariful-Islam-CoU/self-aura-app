import { router } from 'expo-router';

import { FeaturePlaceholder } from '@/components/common/FeaturePlaceholder';
import { AppHeader, Screen } from '@/components/layout';

/**
 * Notification centre placeholder, opened from the Home header's bell
 * action. Deliberately empty - no fake notifications. Pushed above the
 * tabs (like `/module/[key]`), so Back returns to the tab that opened it.
 */
export default function NotificationsScreen() {
  return (
    <Screen scroll={false}>
      <AppHeader variant="feature" title="Notifications" onBack={() => router.back()} />
      <FeaturePlaceholder
        icon="notifications-outline"
        title="Notifications"
        description="The notification centre will be implemented in a future step."
      />
    </Screen>
  );
}
