// Expense service - all expense-related API calls live here.
// Endpoints (all require authentication):
//   GET    /expenses         - paginated list (search / category / payment
//                              method / date range / sort) - expenses.view
//   POST   /expenses         - create (expenses.create)
//   GET    /expenses/:id     - single expense (expenses.view)
//   PATCH  /expenses/:id     - update (expenses.edit)
//   DELETE /expenses/:id     - soft delete (expenses.delete)
//   GET    /expenses/summary - backend-computed totals (reports.expenses)

import { apiClient, type ApiEnvelope } from '@/api';

import type {
  CreateExpenseInput,
  Expense,
  ExpenseListData,
  ExpenseListParams,
  ExpenseSummaryData,
  ExpenseSummaryParams,
  UpdateExpenseInput,
} from '../types';

class ExpenseService {
  private readonly basePath = '/expenses';

  async listExpenses(params: ExpenseListParams = {}): Promise<ExpenseListData> {
    const query: Record<string, string | number | undefined> = {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      category: params.category || undefined,
      paymentMethod: params.paymentMethod || undefined,
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };
    const response = await apiClient.get<ApiEnvelope<ExpenseListData>>(this.basePath, {
      params: query,
    });
    return response.data;
  }

  async getExpense(id: string): Promise<Expense> {
    const response = await apiClient.get<ApiEnvelope<{ expense: Expense }>>(
      `${this.basePath}/${id}`,
    );
    return response.data.expense;
  }

  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    const response = await apiClient.post<ApiEnvelope<{ expense: Expense }>>(this.basePath, input);
    return response.data.expense;
  }

  async updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense> {
    const response = await apiClient.patch<ApiEnvelope<{ expense: Expense }>>(
      `${this.basePath}/${id}`,
      input,
    );
    return response.data.expense;
  }

  /** Soft-deletes the expense (hidden from all future lists). */
  async deleteExpense(id: string): Promise<Expense> {
    const response = await apiClient.delete<ApiEnvelope<{ expense: Expense }>>(
      `${this.basePath}/${id}`,
    );
    return response.data.expense;
  }

  /** Backend-computed totals for the given filters (reports.expenses). */
  async getExpenseSummary(params: ExpenseSummaryParams = {}): Promise<ExpenseSummaryData> {
    const query: Record<string, string | undefined> = {
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      category: params.category || undefined,
      paymentMethod: params.paymentMethod || undefined,
    };
    const response = await apiClient.get<ApiEnvelope<ExpenseSummaryData>>(
      `${this.basePath}/summary`,
      { params: query },
    );
    return response.data;
  }
}

export const expenseService = new ExpenseService();
export { ExpenseService };
