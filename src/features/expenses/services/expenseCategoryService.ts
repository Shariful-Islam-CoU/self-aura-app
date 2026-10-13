// Expense category service - API calls for expense categories.
// Endpoints (all require authentication; mutations map to the
// `expenses.create` / `expenses.edit` permission keys - there is no separate
// category permission):
//   GET    /expense-categories     - paginated list (search / isActive / sort)
//   POST   /expense-categories     - create (expenses.create)
//   GET    /expense-categories/:id - single category (expenses.view)
//   PATCH  /expense-categories/:id - update (expenses.edit)
//   DELETE /expense-categories/:id - deactivate (expenses.edit)

import { apiClient, type ApiEnvelope } from '@/api';

import type {
  CreateExpenseCategoryInput,
  ExpenseCategory,
  ExpenseCategoryListData,
  ExpenseCategoryListParams,
  UpdateExpenseCategoryInput,
} from '../types';

class ExpenseCategoryService {
  private readonly basePath = '/expense-categories';

  async listCategories(params: ExpenseCategoryListParams = {}): Promise<ExpenseCategoryListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      isActive: params.isActive,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };
    const response = await apiClient.get<ApiEnvelope<ExpenseCategoryListData>>(this.basePath, {
      params: query,
    });
    return response.data;
  }

  async getCategory(id: string): Promise<ExpenseCategory> {
    const response = await apiClient.get<ApiEnvelope<{ category: ExpenseCategory }>>(
      `${this.basePath}/${id}`,
    );
    return response.data.category;
  }

  async createCategory(input: CreateExpenseCategoryInput): Promise<ExpenseCategory> {
    const response = await apiClient.post<ApiEnvelope<{ category: ExpenseCategory }>>(
      this.basePath,
      input,
    );
    return response.data.category;
  }

  async updateCategory(id: string, input: UpdateExpenseCategoryInput): Promise<ExpenseCategory> {
    const response = await apiClient.patch<ApiEnvelope<{ category: ExpenseCategory }>>(
      `${this.basePath}/${id}`,
      input,
    );
    return response.data.category;
  }

  /** Deactivates the category (expense creation then rejects it). */
  async deactivateCategory(id: string): Promise<ExpenseCategory> {
    const response = await apiClient.delete<ApiEnvelope<{ category: ExpenseCategory }>>(
      `${this.basePath}/${id}`,
    );
    return response.data.category;
  }
}

export const expenseCategoryService = new ExpenseCategoryService();
export { ExpenseCategoryService };
