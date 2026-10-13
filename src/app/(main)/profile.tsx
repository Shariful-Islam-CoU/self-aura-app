import { router } from 'expo-router';

import { FeaturePlaceholder } from '@/components/common/FeaturePlaceholder';
import { AppHeader, Screen } from '@/components/layout';

/**
 * Profile placeholder, opened from More > Account. Pushed above the tabs
 * (like `/module/[key]`), so Back returns to More. The future screen
 * holds name/email/phone/role, password change and logout.
 */
export default function ProfileScreen() {
  return (
    <Screen scroll={false}>
      <AppHeader variant="feature" title="Profile" onBack={() => router.back()} />
      <FeaturePlaceholder
        icon="person-outline"
        title="Profile"
        description="Your account information will be implemented in a future step."
      />
    </Screen>
  );
}
