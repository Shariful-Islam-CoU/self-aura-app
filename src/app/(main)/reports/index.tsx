import { useCallback, useState, useRef } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, Text as RNText } from 'react-native';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/layout';
import { useAuth, useTheme } from '@/providers';
import { useReportSummary, useSalesTrend, type DateRangePreset, getDateRangeForPreset } from '@/features/reports';
import { formatAmount } from '@/lib/utils/format';
import { KpiGrid } from '@/features/dashboard/components';
import { PeriodSelector } from '@/features/dashboard/components';
import { SimpleLineChart } from '@/features/reports/components';

export default function ReportsScreen() {
  const { theme } = useTheme();
  const { canAccess } = useAuth();
  const [preset, setPreset] = useState<DateRangePreset>('thisMonth');
  const [refreshing, setRefreshing] = useState(false);
  const refreshControlRef = useRef<RefreshControl>(null);

  const canView = canAccess('reports.dashboard') || canAccess('reports.sales') || canAccess('reports.expenses') || canAccess('reports.payments') || canAccess('reports.profitLoss') || canAccess('reports.inventory') || canAccess('reports.customers') || canAccess('reports.returns') || canAccess('reports.delivery') || canAccess('reports.products') || canAccess('reports.categories') || canAccess('reports.dailySummary') || canAccess('reports.purchases');

  const filters = getDateRangeForPreset(preset);
  const { data, isLoading, isError, refetch } = useReportSummary(filters);
  const { data: trend } = useSalesTrend({ ...filters, groupBy: 'day' }, true);

  const handlePresetChange = useCallback((p: DateRangePreset) => {
    setPreset(p);
  }, []);

  const handleRefreshControl = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (!canView) return <Screen scroll><ErrorState title="Access denied" description="You do not have permission to view reports." /></Screen>;

  if (isLoading && !data) return <LoadingState />;
  if (isError && !data) return <Screen scroll><ErrorState title="Failed to load reports" description="Please try again." onRetry={() => refetch()} /></Screen>;

  const reportCards = [
    { key: 'sales', title: 'Sales Report', description: 'Orders, revenue, trends by source/payment/category', route: 'sales', icon: 'trending-up', canView: canAccess('reports.sales') },
    { key: 'purchases', title: 'Purchases Report', description: 'Supplier purchases, amounts, status breakdown', route: 'purchases', icon: 'cart', canView: canAccess('reports.purchases') },
    { key: 'expenses', title: 'Expenses Report', description: 'Category breakdown, trends, payment methods', route: 'expenses', icon: 'receipt', canView: canAccess('reports.expenses') },
    { key: 'payments', title: 'Payments Report', description: 'Verified/pending/refunded by method', route: 'payments', icon: 'card', canView: canAccess('reports.payments') },
    { key: 'profitLoss', title: 'Profit & Loss', description: 'Revenue, COGS, gross profit, expenses, net profit', route: 'profit-loss', icon: 'calculator', canView: canAccess('reports.profitLoss') },
    { key: 'inventory', title: 'Inventory Report', description: 'Stock value, low/out of stock, by category', route: 'inventory', icon: 'package', canView: canAccess('reports.inventory') },
    { key: 'customers', title: 'Customers Report', description: 'New/returning customers, growth trends', route: 'customers', icon: 'people', canView: canAccess('reports.customers') },
    { key: 'returns', title: 'Returns Report', description: 'Return counts, refund amounts, reasons', route: 'returns', icon: 'rotate-ccw', canView: canAccess('reports.returns') },
    { key: 'delivery', title: 'Delivery Report', description: 'Charges, courier performance, zones', route: 'delivery', icon: 'truck', canView: canAccess('reports.delivery') },
    { key: 'products', title: 'Product Performance', description: 'Top/low products by units, revenue, profit', route: 'products', icon: 'cube', canView: canAccess('reports.products') },
    { key: 'categories', title: 'Category Performance', description: 'Sales, profit, product count by category', route: 'categories', icon: 'grid', canView: canAccess('reports.categories') },
    { key: 'dailySummary', title: 'Daily Summary', description: 'Per-day sales, orders, expenses, profit', route: 'daily-summary', icon: 'calendar', canView: canAccess('reports.dailySummary') },
  ];

  return (
    <Screen>
      <FlatList
        data={reportCards.filter(c => c.canView)}
        renderItem={({ item }) => (
          <Button
            key={item.key}
            variant="outline"
            style={styles.reportCard}
            onPress={() => console.log('Navigate to', item.route)}
            title={item.title}
          >
            <RNText style={styles.reportCardTitle}>{item.title}</RNText>
            <RNText style={styles.reportCardDesc}>{item.description}</RNText>
          </Button>
        )}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <RNText style={styles.title}>Reports</RNText>
            <PeriodSelector
              value={preset}
              onChange={handlePresetChange}
            />
            {data && <KpiGrid data={data} />}
            {trend?.series.length && (
              <View style={styles.section}>
                <RNText style={styles.sectionTitle}>Sales Trend</RNText>
                <View style={styles.chartContainer}>
                  <SimpleLineChart
                    data={trend.series}
                    color={theme.colors.primary}
                    height={200}
                    formatValue={formatAmount}
                  />
                </View>
              </View>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl
            ref={refreshControlRef}
            refreshing={refreshing}
            onRefresh={handleRefreshControl}
            colors={[theme.colors.primary]}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 24 },
  list: { gap: 12 },
  header: { gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  chartContainer: { height: 200 },
  reportGrid: { gap: 12 },
  reportCard: { alignItems: 'flex-start', textAlign: 'left', width: '100%', padding: 16 },
  reportCardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  reportCardDesc: { fontSize: 13, color: '#6b7280' },
});