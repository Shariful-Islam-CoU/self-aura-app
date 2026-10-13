import { Pressable, StyleSheet, View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { ErrorState, LoadingIndicator } from '@/components/feedback';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import { getErrorMessage } from '@/api';
import { spacing } from '@/theme';
import { useTheme } from '@/providers';
import { supplierStatusLabel, purchaseStatusLabel, purchaseStatusTone } from '../labels';
import { flattenSupplierPurchases, useSupplierPurchaseHistory } from '../queries';
import type { Supplier, SupplierPurchaseStats, SupplierPurchaseSummary } from '../types';
import { SectionCard, DetailRow } from '@/features/customers/components/SectionCard';

interface SupplierOverviewSectionProps {
  supplier: Supplier;
}

export function SupplierOverviewSection({ supplier }: SupplierOverviewSectionProps) {
  return (
    <SectionCard title="Overview">
      <DetailRow label="Name" value={supplier.name} emphasis />
      <DetailRow label="Status" value={supplierStatusLabel(supplier.isActive)} />
      <DetailRow label="Joined" value={formatDate(supplier.createdAt)} />
    </SectionCard>
  );
}

interface SupplierContactSectionProps {
  supplier: Supplier;
}

export function SupplierContactSection({ supplier }: SupplierContactSectionProps) {
  return (
    <SectionCard title="Contact">
      <DetailRow label="Phone" value={supplier.phone} />
      {supplier.alternatePhone ? (
        <DetailRow label="Alternate phone" value={supplier.alternatePhone} />
      ) : null}
      {supplier.email ? <DetailRow label="Email" value={supplier.email} /> : null}
    </SectionCard>
  );
}

interface SupplierAddressSectionProps {
  supplier: Supplier;
}

export function SupplierAddressSection({ supplier }: SupplierAddressSectionProps) {
  if (!supplier.address) return null;

  return (
    <SectionCard title="Address">
      <DetailRow label="Address" value={supplier.address} />
    </SectionCard>
  );
}

interface SupplierNotesSectionProps {
  supplier: Supplier;
}

export function SupplierNotesSection({ supplier }: SupplierNotesSectionProps) {
  if (!supplier.notes) return null;

  return (
    <SectionCard title="Notes">
      <DetailRow label="Notes" value={supplier.notes} />
    </SectionCard>
  );
}

interface SupplierPurchaseSummarySectionProps {
  stats: SupplierPurchaseStats;
}

export function SupplierPurchaseSummarySection({ stats }: SupplierPurchaseSummarySectionProps) {
  return (
    <SectionCard title="Purchase summary">
      <DetailRow
        label="Total purchases this period"
        value={formatNumber(stats.purchaseCount)}
        emphasis
      />
      <DetailRow label="Received" value={formatNumber(stats.receivedCount)} />
      <DetailRow label="Draft" value={formatNumber(stats.draftCount)} />
      <DetailRow label="Cancelled" value={formatNumber(stats.cancelledCount)} />
      <DetailRow label="Total spent" value={formatCurrency(stats.totalSpent)} emphasis />
    </SectionCard>
  );
}

interface PurchaseHistoryRowProps {
  purchase: SupplierPurchaseSummary;
  onPress: (purchaseId: string) => void;
}

function PurchaseHistoryRow({ purchase, onPress }: PurchaseHistoryRowProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={() => onPress(purchase.id)}
      accessibilityRole="button"
      accessibilityLabel={`Purchase ${purchase.purchaseNumber}, ${purchaseStatusLabel(purchase.status)}, ${formatCurrency(purchase.total)}, ${formatDate(purchase.purchaseDate)}`}
      style={({ pressed }) => [
        styles.historyRow,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.historyMain}>
        <View style={styles.historyLeft}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {purchase.purchaseNumber}
          </Text>
          <Text variant="caption" tone="muted">
            {purchase.itemsCount} {purchase.itemsCount === 1 ? 'item' : 'items'} ·{' '}
            {formatDate(purchase.purchaseDate)}
          </Text>
        </View>
        <View style={styles.historyRight}>
          <Badge
            label={purchaseStatusLabel(purchase.status)}
            tone={purchaseStatusTone(purchase.status)}
          />
          <Text variant="subtitle" style={styles.total} align="right">
            {formatCurrency(purchase.total)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  historyRow: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  historyMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  historyLeft: { flex: 1 },
  historyRight: { alignItems: 'flex-end', gap: spacing.xs },
  total: { textAlign: 'right' },
  empty: { textAlign: 'center', paddingVertical: spacing.lg },
  loadMore: { textAlign: 'center', paddingVertical: spacing.md },
});

interface SupplierPurchaseHistoryProps {
  supplierId: string;
  canViewPurchases: boolean;
}

export function SupplierPurchaseHistory({
  supplierId,
  canViewPurchases,
}: SupplierPurchaseHistoryProps) {
  const historyQuery = useSupplierPurchaseHistory(supplierId, canViewPurchases);

  const purchases = flattenSupplierPurchases(historyQuery.data?.pages);

  if (!canViewPurchases) return null;

  if (historyQuery.isPending && purchases.length === 0) {
    return (
      <SectionCard title="Recent purchases">
        <LoadingIndicator label="Loading purchase history..." />
      </SectionCard>
    );
  }

  if (historyQuery.isError && purchases.length === 0) {
    return (
      <SectionCard title="Recent purchases">
        <ErrorState
          title="Failed to load purchases"
          message={getErrorMessage(historyQuery.error)}
          onRetry={() => void historyQuery.refetch()}
          retryLabel="Retry"
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Recent purchases">
      {purchases.length === 0 ? (
        <Text variant="bodyMedium" tone="muted" style={styles.empty}>
          No purchase history for this supplier.
        </Text>
      ) : (
        <>
          {purchases.map((purchase) => (
            <PurchaseHistoryRow key={purchase.id} purchase={purchase} onPress={() => {}} />
          ))}
          {historyQuery.hasNextPage && (
            <Pressable
              onPress={() => void historyQuery.fetchNextPage()}
              disabled={historyQuery.isFetchingNextPage}
              accessibilityLabel="Load more purchases"
            >
              <Text variant="bodyMedium" tone="primary" style={styles.loadMore}>
                {historyQuery.isFetchingNextPage ? 'Loading more...' : 'Load more'}
              </Text>
            </Pressable>
          )}
        </>
      )}
    </SectionCard>
  );
}
