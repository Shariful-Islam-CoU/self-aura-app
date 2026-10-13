export interface ReportSummary {
  fromDate: string;
  toDate: string;
  sales: {
    orderCount: number;
    completedCount: number;
    grossSales: number;
    discount: number;
    deliveryCharges: number;
    netSales: number;
    averageOrderValue: number;
  };
  cogs: number;
  grossProfit: number;
  expenses: { total: number; count: number };
  netProfit: number;
  customers: {
    totalCustomers: number;
    newCustomers: number;
    activeCustomers: number;
    customersWithOrders: number;
    repeatCustomers: number;
    totalCustomerOrders: number;
    totalCustomerSales: number;
  };
  payments: {
    received: number;
    receivedCount: number;
    refunds: number;
    refundCount: number;
    netReceived: number;
  };
  returns: {
    returnCount: number;
    requestedCount: number;
    approvedCount: number;
    rejectedCount: number;
    receivedCount: number;
    completedCount: number;
    cancelledCount: number;
    returnedQuantity: number;
    refundedAmount: number;
  };
  inventory: {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalStockUnits: number;
    costValue: number;
    sellingValue: number;
  };
}

export interface SalesSeriesRow {
  period: string;
  orderCount: number;
  completedCount: number;
  grossSales: number;
  netSales: number;
}

export interface SalesTrendData {
  series: SalesSeriesRow[];
  dateGrouping: 'day' | 'week' | 'month';
}

export type ReportFilters = {
  startDate?: string;
  endDate?: string;
  productId?: string;
  categoryId?: string;
  customerId?: string;
  supplierId?: string;
  courierId?: string;
  paymentMethod?: string;
  status?: string;
  groupBy?: string;
};

export type DateRangePreset =
  'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'previousMonth' | 'custom';