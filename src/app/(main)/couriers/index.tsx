import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Chip, IconButton, SearchInput, Text } from '@/components/ui';
import { useCouriersInfinite } from '@/features/couriers';
import type { Courier, CourierListParams } from '@/features/couriers';
import { CourierCard, CourierListSkeleton } from '@/features/couriers/components';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_CHIPS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

/**
 * Couriers root: the backend list with server-side search and active filter,
 * infinite pagination and pull-to-refresh. Create is gated by `couriers.create`
 * (backend re-validates), and tapping a row opens its details.
 */
export default function CouriersScreen() {
  const { hasPermission } = usePermissions();
  const { theme } = useTheme();

  const canView = hasPermission('couriers.view');
  const canCreate = hasPermission('couriers.create');

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const search = debouncedSearch.trim();
  const params: CourierListParams = useMemo(
    () => (status === 'all' ? {} : { isActive: status === 'active' }),
    [status],
  );
  const couriersQuery = useCouriersInfinite(params, search);

  const couriers = useMemo(() => {
    const seen = new Set<string>();
    const list: Courier[] = [];
    for (const page of couriersQuery.data?.pages ?? []) {
      for (const courier of page.couriers) {
        if (!seen.has(courier.id)) {
          seen.add(courier.id);
          list.push(courier);
        }
      }
    }
    return list;
  }, [couriersQuery.data]);

  const hasCriteria = search.length > 0 || status !== 'all';

  const handleRefresh = async () => {
    if (couriersQuery.isFetching) return;
    setRefreshing(true);
    try {
      await couriersQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleEndReached = () => {
    if (couriersQuery.hasNextPage && !couriersQuery.isFetching) {
      void couriersQuery.fetchNextPage();
    }
  };

  const resetCriteria = () => {
    setSearchInput('');
    setStatus('all');
  };

  const header = (
    <AppHeader
      variant="feature"
      title="Couriers"
      actions={
        canCreate ? (
          <IconButton
            icon="add-outline"
            accessibilityLabel="Create courier"
            onPress={() => router.push('/couriers/new')}
          />
        ) : null
      }
    />
  );

  if (!canView) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view couriers." />
      </Screen>
    );
  }

  let content: ReactNode;
  if (couriersQuery.isPending && couriers.length === 0) {
    content = <CourierListSkeleton />;
  } else if (couriersQuery.isError && couriers.length === 0) {
    content = (
      <ErrorState
        title="Failed to load couriers"
        message={getErrorMessage(couriersQuery.error)}
        onRetry={() => void couriersQuery.refetch()}
        retryLabel="Retry"
      />
    );
  } else {
    content = (
      <FlatList
        data={couriers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CourierCard courier={item} onPress={(id) => router.push(`/couriers/${id}`)} />
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
              title="No couriers match"
              description="Try a different search or clear the applied filter."
              actionLabel="Clear filters"
              onAction={resetCriteria}
            />
          ) : (
            <EmptyState
              icon="bicycle-outline"
              title="No couriers yet"
              description="Add a delivery partner to start creating shipments."
              actionLabel={canCreate ? 'Create courier' : undefined}
              onAction={canCreate ? () => router.push('/couriers/new') : undefined}
            />
          )
        }
        ListFooterComponent={
          couriersQuery.hasNextPage && couriersQuery.isFetchingNextPage ? (
            <LoadingIndicator label="Loading more couriers..." />
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
          placeholder="Search couriers"
          accessibilityLabel="Search couriers by name, phone or contact person"
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
          Inactive couriers keep trip history but cannot receive new shipments.
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
