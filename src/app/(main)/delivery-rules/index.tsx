import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Chip, IconButton, SearchInput, Text } from '@/components/ui';
import {
  DeliveryRuleCard,
  DeliveryRuleListSkeleton,
} from '@/features/deliveryRules/components';
import {
  useDeliveryRulesInfinite,
  useToggleDeliveryRule,
} from '@/features/deliveryRules';
import type { DeliveryRule, DeliveryRuleListParams } from '@/features/deliveryRules';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme, useToast } from '@/providers';
import { spacing } from '@/theme';

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_CHIPS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

/**
 * Delivery-rules root: the flat, self-selectable checkout options. Server-side
 * search and active filter, infinite pagination and pull-to-refresh. Every
 * request goes through TanStack Query with the filters baked into the key, and
 * every mutation stays backend-authoritative (a rejected request shows the
 * server's own message and reloads the real state).
 */
export default function DeliveryRulesScreen() {
  const { hasPermission } = usePermissions();
  const { theme } = useTheme();
  const toast = useToast();

  const canView = hasPermission('deliveryRules.view');
  const canCreate = hasPermission('deliveryRules.create');
  const canEdit = hasPermission('deliveryRules.edit');

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  // Local "last known intent" per rule: gives the switch instant feedback
  // while the backend confirms. Removed only when the server rejects it.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  const search = debouncedSearch.trim();
  const params: DeliveryRuleListParams = useMemo(
    () => (status === 'all' ? {} : { isActive: status === 'active' }),
    [status],
  );
  const rulesQuery = useDeliveryRulesInfinite(params, search);
  const toggle = useToggleDeliveryRule();

  const rules = useMemo(() => {
    const seen = new Set<string>();
    const list: DeliveryRule[] = [];
    for (const page of rulesQuery.data?.pages ?? []) {
      for (const rule of page.items) {
        if (!seen.has(rule._id)) {
          seen.add(rule._id);
          list.push(rule);
        }
      }
    }
    return list;
  }, [rulesQuery.data]);

  const hasCriteria = search.length > 0 || status !== 'all';

  const handleRefresh = async () => {
    if (rulesQuery.isFetching) return;
    setRefreshing(true);
    try {
      await rulesQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleEndReached = () => {
    if (rulesQuery.hasNextPage && !rulesQuery.isFetching) {
      void rulesQuery.fetchNextPage();
    }
  };

  const handleToggle = (rule: DeliveryRule, isActive: boolean) => {
    setOverrides((prev) => ({ ...prev, [rule._id]: isActive }));
    setPendingId(rule._id);
    toggle.mutate(
      { id: rule._id, isActive },
      {
        onError: (error) => {
          setOverrides((prev) => {
            const next = { ...prev };
            delete next[rule._id];
            return next;
          });
          toast.error(getErrorMessage(error));
        },
        onSettled: () => setPendingId(null),
      },
    );
  };

  const resetCriteria = () => {
    setSearchInput('');
    setStatus('all');
  };

  const header = (
    <AppHeader
      variant="feature"
      title="Delivery Rules"
      actions={
        canCreate ? (
          <IconButton
            icon="add-outline"
            accessibilityLabel="Create delivery rule"
            onPress={() => router.push('/delivery-rules/new')}
          />
        ) : null
      }
    />
  );

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState
          title="Access denied"
          message="You don't have permission to view delivery rules."
        />
      </Screen>
    );
  }

  let content: ReactNode;
  if (rulesQuery.isPending && rules.length === 0) {
    content = <DeliveryRuleListSkeleton />;
  } else if (rulesQuery.isError && rules.length === 0) {
    content = (
      <ErrorState
        title="Failed to load delivery rules"
        message={getErrorMessage(rulesQuery.error)}
        onRetry={() => void rulesQuery.refetch()}
        retryLabel="Retry"
      />
    );
  } else {
    content = (
      <FlatList
        data={rules}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <DeliveryRuleCard
            rule={{ ...item, isActive: overrides[item._id] ?? item.isActive }}
            canEdit={canEdit}
            toggling={pendingId === item._id}
            onEdit={(rule) => router.push(`/delivery-rules/edit/${rule._id}`)}
            onToggle={handleToggle}
          />
        )}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          hasCriteria ? (
            <EmptyState
              icon="search-outline"
              title="No delivery rules match"
              description="Try a different search or clear the applied filter."
              actionLabel="Clear filters"
              onAction={resetCriteria}
            />
          ) : (
            <EmptyState
              icon="options-outline"
              title="No delivery rules yet"
              description="Without a rule, checkout shows no delivery options."
              actionLabel={canCreate ? 'Create delivery rule' : undefined}
              onAction={canCreate ? () => router.push('/delivery-rules/new') : undefined}
            />
          )
        }
        ListFooterComponent={
          rulesQuery.hasNextPage && rulesQuery.isFetchingNextPage ? (
            <LoadingIndicator label="Loading more rules..." />
          ) : null
        }
      />
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      {header}
      <View style={styles.toolbar}>
        <SearchInput
          value={searchInput}
          onValueChange={setSearchInput}
          placeholder="Search delivery rules"
          accessibilityLabel="Search delivery rules by name"
        />
        <View style={styles.chips}>
          {STATUS_CHIPS.map((chip) => (
            <Chip
              key={chip.value}
              label={chip.label}
              selected={status === chip.value}
              onPress={() => setStatus(chip.value)}
            />
          ))}
        </View>
        <Text variant="caption" tone="muted">
          Customers see all active rules at checkout and pick one.
        </Text>
      </View>

      <View style={styles.content}>{content}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
