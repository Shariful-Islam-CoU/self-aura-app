import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { getErrorMessage } from '@/api';
import { EmptyState, ErrorState, LoadingIndicator } from '@/components/feedback';
import { AppHeader, Screen } from '@/components/layout';
import { Button, IconButton, SearchInput, Select, type SelectOption } from '@/components/ui';
import {
  ShipmentCard,
  ShipmentFiltersSheet,
  ShipmentListSkeleton,
  type ShipmentFilterValues,
} from '@/features/shipments/components';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useShipmentsInfinite } from '@/features/shipments/queries';
import type {
  Shipment,
  ShipmentListFilters,
  ShipmentSortBy,
  ShipmentSortOrder,
} from '@/features/shipments/types';
import { usePermissions } from '@/hooks/usePermissions';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';

/** Sort options mapped to the backend's `sortBy`/`sortOrder` pair. */
const SORT_OPTIONS: readonly SelectOption[] = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'deliveryCharge:desc', label: 'Highest charge' },
  { value: 'deliveryCharge:asc', label: 'Lowest charge' },
];

/**
 * Shipments root: server-side search (shipment/tracking/order number,
 * customer - that is what the backend matches), filter bottom sheet, sort,
 * infinite pagination and pull-to-refresh. Every request goes through
 * TanStack Query with the filters baked into the key, so cache entries are
 * never mixed up between filter combinations and switching filters keeps
 * the old page visible while the new one loads.
 */
export default function ShipmentsScreen() {
  const { hasPermission } = usePermissions();
  const { theme } = useTheme();
  const canViewShipments = hasPermission('shipments.view');
  const canCreateShipment = hasPermission('shipments.create');

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [filterValues, setFilterValues] = useState<ShipmentFilterValues>({});
  // Sheet working copy: reset from the applied filters on every open so it
  // can never hold stale state between visits.
  const [draftFilters, setDraftFilters] = useState<ShipmentFilterValues>({});
  const [sort, setSort] = useState<{
    sortBy: ShipmentSortBy;
    sortOrder: ShipmentSortOrder;
  }>({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const search = debouncedSearch.trim();
  const filters: ShipmentListFilters = useMemo(
    () => ({ ...filterValues, ...sort }),
    [filterValues, sort],
  );
  const shipmentsQuery = useShipmentsInfinite(filters, search);

  const activeFilterCount = [
    filterValues.status,
    filterValues.fromDate,
    filterValues.toDate,
  ].filter(Boolean).length;
  const hasCriteria = activeFilterCount > 0 || search.length > 0;

  // Flatten pages while de-duplicating ids so a page fetched during a
  // refresh can never render a shipment twice.
  const shipments = useMemo(() => {
    const seen = new Set<string>();
    const list: Shipment[] = [];
    for (const page of shipmentsQuery.data?.pages ?? []) {
      for (const shipment of page.shipments) {
        if (!seen.has(shipment.id)) {
          seen.add(shipment.id);
          list.push(shipment);
        }
      }
    }
    return list;
  }, [shipmentsQuery.data]);

  const handleRefresh = async () => {
    if (shipmentsQuery.isFetching) return; // never race an in-flight request
    setRefreshing(true);
    try {
      await shipmentsQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleEndReached = () => {
    if (shipmentsQuery.hasNextPage && !shipmentsQuery.isFetching) {
      void shipmentsQuery.fetchNextPage();
    }
  };

  const handleSortChange = (value: string) => {
    if (value === 'createdAt:asc') {
      setSort({ sortBy: 'createdAt', sortOrder: 'asc' });
    } else if (value === 'deliveryCharge:desc') {
      setSort({ sortBy: 'deliveryCharge', sortOrder: 'desc' });
    } else if (value === 'deliveryCharge:asc') {
      setSort({ sortBy: 'deliveryCharge', sortOrder: 'asc' });
    } else {
      setSort({ sortBy: 'createdAt', sortOrder: 'desc' });
    }
  };

  const resetCriteria = () => {
    setSearchInput('');
    setFilterValues({});
  };

  const openFilters = () => {
    setDraftFilters(filterValues);
    setFiltersOpen(true);
  };

  const applyFilters = (next: ShipmentFilterValues) => {
    setFilterValues(next);
    setFiltersOpen(false);
  };

  const header = (
    <AppHeader
      variant="feature"
      title="Shipments"
      actions={
        canCreateShipment ? (
          <IconButton
            icon="add-outline"
            accessibilityLabel="Create shipment"
            onPress={() => router.push('/shipments/new')}
          />
        ) : null
      }
    />
  );

  if (!canViewShipments) {
    return (
      <Screen>
        {header}
        <ErrorState title="Access denied" message="You don't have permission to view shipments." />
      </Screen>
    );
  }

  let content: ReactNode;
  if (shipmentsQuery.isPending && shipments.length === 0) {
    content = <ShipmentListSkeleton />;
  } else if (shipmentsQuery.isError && shipments.length === 0) {
    content = (
      <ErrorState
        title="Failed to load shipments"
        message={getErrorMessage(shipmentsQuery.error)}
        onRetry={() => void shipmentsQuery.refetch()}
        retryLabel="Retry"
      />
    );
  } else {
    content = (
      <FlatList
        data={shipments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ShipmentCard shipment={item} onPress={(id) => router.push(`/shipments/${id}`)} />
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
              title="No shipments match"
              description="Try a different search or clear the applied filters."
              actionLabel="Clear filters"
              onAction={resetCriteria}
            />
          ) : (
            <EmptyState
              icon="cube-outline"
              title="No shipments yet"
              description="Shipments will appear here as soon as orders are handed to a courier."
              actionLabel={canCreateShipment ? 'Create shipment' : undefined}
              onAction={canCreateShipment ? () => router.push('/shipments/new') : undefined}
            />
          )
        }
        ListFooterComponent={
          shipmentsQuery.hasNextPage && shipmentsQuery.isFetchingNextPage ? (
            <LoadingIndicator label="Loading more shipments..." />
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
          placeholder="Search shipments"
          accessibilityLabel="Search shipments by number, tracking, order or customer"
        />
        <View style={styles.filterRow}>
          <Button
            title={activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
            variant="outline"
            icon="options-outline"
            onPress={openFilters}
            accessibilityLabel={
              activeFilterCount > 0 ? `Open filters, ${activeFilterCount} applied` : 'Open filters'
            }
          />
          <View style={styles.sortWrap}>
            <Select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              options={SORT_OPTIONS}
              onChange={handleSortChange}
            />
          </View>
        </View>
      </View>

      <View style={styles.content}>{content}</View>

      <ShipmentFiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={draftFilters}
        onValueChange={setDraftFilters}
        onApply={applyFilters}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sortWrap: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    flexGrow: 1, // lets pull-to-refresh work on an empty list
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
