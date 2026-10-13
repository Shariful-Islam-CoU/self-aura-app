import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '@/components/layout';
import { LoadingState, ErrorState, EmptyState, Text as UItext } from '@/components/ui';
import { useTheme } from '@/providers';
import {
  useSalesReport,
  usePurchasesReport,
  usePaymentsReport,
  useExpensesReport,
  useProfitLossReport,
  useInventoryReport,
  useInventoryMovementsReport,
  useCustomersReport,
  useReturnsReport,
  useDeliveryReport,
  useProductsReport,
  useCategoriesReport,
  useDailySummaryReport,
  getDateRangeForPreset,
  type ReportType,
} from '@/features/reports';

const REPORT_TITLES: Record<ReportType, string> = {
  sales: 'Sales Report',
  purchases: 'Purchases Report',
  payments: 'Payments Report',
  expenses: 'Expenses Report',
  profitLoss: 'Profit & Loss',
  inventory: 'Inventory Report',
  inventoryMovements: 'Inventory Movements',
  customers: 'Customers Report',
  returns: 'Returns Report',
  delivery: 'Delivery Report',
  products: 'Product Performance',
  categories: 'Category Performance',
  dailySummary: 'Daily Summary',
};

const REPORT_DESCRIPTIONS: Record<ReportType, string> = {
  sales: 'Orders, revenue, trends by source/payment/category',
  purchases: 'Supplier purchases, amounts, status breakdown',
  payments: 'Verified/pending/refunded by method',
  expenses: 'Category breakdown, trends, payment methods',
  profitLoss: 'Revenue, COGS, gross profit, expenses, net profit',
  inventory: 'Stock value, low/out of stock, by category',
  inventoryMovements: 'Stock movements by type/date',
  customers: 'New/returning customers, growth trends',
  returns: 'Return counts, refund amounts, reasons',
  delivery: 'Charges, courier performance, zones',
  products: 'Top/low products by units, revenue, profit',
  categories: 'Sales, profit, product count by category',
  dailySummary: 'Per-day sales, orders, expenses, profit',
};

export default function ReportDetailsScreen() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const id = reportId ?? '';
  const { theme } = useTheme();

  if (!id) {
    return (
      <Screen scroll>
        <ErrorState title="Missing ID" description="Invalid route." />
      </Screen>
    );
  }

  const reportType = id as ReportType;
  const isValidReportType = reportType in REPORT_TITLES;

  if (!isValidReportType) {
    return (
      <Screen scroll>
        <ErrorState title="Invalid Report" description={`Unknown report type: ${id}`} />
      </Screen>
    );
  }

  const filters = getDateRangeForPreset('thisMonth');

  // Dynamically select the right hook based on report type
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = (() => {
    switch (reportType) {
      case 'sales':
        return useSalesReport(filters);
      case 'purchases':
        return usePurchasesReport(filters);
      case 'payments':
        return usePaymentsReport(filters);
      case 'expenses':
        return useExpensesReport(filters);
      case 'profitLoss':
        return useProfitLossReport(filters);
      case 'inventory':
        return useInventoryReport(filters);
      case 'inventoryMovements':
        return useInventoryMovementsReport(filters);
      case 'customers':
        return useCustomersReport(filters);
      case 'returns':
        return useReturnsReport(filters);
      case 'delivery':
        return useDeliveryReport(filters);
      case 'products':
        return useProductsReport(filters);
      case 'categories':
        return useCategoriesReport(filters);
      case 'dailySummary':
        return useDailySummaryReport(filters);
      default:
        return { data: null, isLoading: false, isError: true, refetch: () => {} };
    }
  })();

  if (isLoading) return <LoadingState />;
  if (isError) return <Screen scroll><ErrorState title="Failed to load report" description="Try again." onRetry={() => refetch()} /></Screen>;
  if (!data) return <Screen scroll><EmptyState title="No data" description="Report returned no data." /></Screen>;

  return (
    <Screen scroll>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <UItext variant="h2">{REPORT_TITLES[reportType]}</UItext>
          <UItext tone="secondary">{REPORT_DESCRIPTIONS[reportType]}</UItext>
        </View>

        <View style={styles.section}>
          <UItext variant="h3" style={styles.sectionTitle}>Overview</UItext>
          <View style={styles.grid}>
            {data.sales && (
              <>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Orders</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.sales.orderCount}</UItext>
                </View>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Completed</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.sales.completedCount}</UItext>
                </View>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Gross Sales</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.sales.grossSales.toLocaleString()}</UItext>
                </View>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Net Sales</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.sales.netSales.toLocaleString()}</UItext>
                </View>
              </>
            )}
            {data.grossProfit !== undefined && (
              <>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">COGS</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.cogs.toLocaleString()}</UItext>
                </View>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Gross Profit</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.grossProfit.toLocaleString()}</UItext>
                </View>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Expenses</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.expenses.total.toLocaleString()}</UItext>
                </View>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Net Profit</UItext>
                  <UItext variant="numeric" style={[styles.statValue, { color: data.netProfit >= 0 ? theme.colors.success : theme.colors.danger }]}>{data.netProfit.toLocaleString()}</UItext>
                </View>
              </>
            )}
            {data.customers && (
              <>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Total Customers</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.customers.totalCustomers}</UItext>
                </View>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">New Customers</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.customers.newCustomers}</UItext>
                </View>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Repeat Customers</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.customers.repeatCustomers}</UItext>
                </View>
              </>
            )}
            {data.payments && (
              <>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Received</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.payments.received.toLocaleString()}</UItext>
                </View>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Refunds</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.payments.refunds.toLocaleString()}</UItext>
                </View>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Net Received</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.payments.netReceived.toLocaleString()}</UItext>
                </View>
              </>
            )}
            {data.returns && (
              <>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Returns</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.returns.returnCount}</UItext>
                </View>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Refunded</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.returns.refundedAmount.toLocaleString()}</UItext>
                </View>
              </>
            )}
            {data.inventory && (
              <>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Products</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.inventory.totalProducts}</UItext>
                </View>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Low Stock</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.inventory.lowStockCount}</UItext>
                </View>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Out of Stock</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.inventory.outOfStockCount}</UItext>
                </View>
                <View style={styles.card}>
                  <UItext tone="muted" variant="caption">Stock Value</UItext>
                  <UItext variant="numeric" style={styles.statValue}>{data.inventory.costValue.toLocaleString()}</UItext>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 24 },
  header: { gap: 4 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { flex: 1, minWidth: 140, backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 20 },
});