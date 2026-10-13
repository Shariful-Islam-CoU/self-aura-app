import { Stack, router, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/feedback';
import { ModulePlaceholder } from '@/components/common/ModulePlaceholder';
import { Screen } from '@/components/layout/Screen';
import { canAccessModule, findModule } from '@/navigation';
import { useAuth } from '@/providers';

/**
 * Single dynamic route behind every module entry (`/module/<key>`).
 *
 * Step 1 renders a placeholder; later steps replace each module with its
 * dedicated screens while this route stays as the generic fallback for
 * entries that are not yet migrated.
 */
export default function ModuleScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { canAccess } = useAuth();

  const module = typeof key === 'string' ? findModule(key) : undefined;

  if (!module) {
    return (
      <Screen scroll={false}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <EmptyState
          icon="help-circle-outline"
          title="Module not found"
          description={`No module is registered for "${typeof key === 'string' ? key : 'unknown'}".`}
          actionLabel="Back to More"
          onAction={() => router.replace('/more')}
        />
      </Screen>
    );
  }

  // UX-only check; the backend stays authoritative and will reject data
  // requests the user is not allowed to make (403), like on the web.
  if (!canAccessModule(module, canAccess)) {
    return (
      <Screen scroll={false}>
        <Stack.Screen options={{ title: module.label }} />
        <EmptyState
          icon="lock-closed-outline"
          title="Access denied"
          description="Your account does not have permission to view this module."
          actionLabel="Back to More"
          onAction={() => router.replace('/more')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Stack.Screen options={{ title: module.label }} />
      <ModulePlaceholder module={module} />
    </Screen>
  );
}
