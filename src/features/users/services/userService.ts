import { apiClient, type ApiEnvelope } from '@/api';

import type {
  ChangeRoleInput,
  CreateUserInput,
  ResetPasswordInput,
  UpdateUserInput,
  User,
  UserListData,
  UserListParams,
} from '../types';

interface UserListResponse {
  items: User[];
  pagination: UserListData['pagination'];
}

class UserService {
  private readonly basePath = '/management/users';

  async list(params: UserListParams = {}): Promise<UserListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
      role: params.role,
      status: params.status,
      isActive: params.isActive,
    };
    const response = await apiClient.get<ApiEnvelope<UserListResponse>>(this.basePath, { params: query });
    return { users: response.data.items, pagination: response.data.pagination };
  }

  async getById(id: string): Promise<User> {
    const response = await apiClient.get<ApiEnvelope<{ user: User }>>(`${this.basePath}/${id}`);
    return response.data.user;
  }

  async create(input: CreateUserInput): Promise<User> {
    const response = await apiClient.post<ApiEnvelope<{ user: User }>>(this.basePath, input);
    return response.data.user;
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const response = await apiClient.patch<ApiEnvelope<{ user: User }>>(`${this.basePath}/${id}`, input);
    return response.data.user;
  }

  async approve(id: string): Promise<User> {
    const response = await apiClient.post<ApiEnvelope<{ user: User }>>(`${this.basePath}/${id}/approve`);
    return response.data.user;
  }

  async reject(id: string): Promise<User> {
    const response = await apiClient.post<ApiEnvelope<{ user: User }>>(`${this.basePath}/${id}/reject`);
    return response.data.user;
  }

  async enable(id: string): Promise<User> {
    const response = await apiClient.post<ApiEnvelope<{ user: User }>>(`${this.basePath}/${id}/enable`);
    return response.data.user;
  }

  async disable(id: string): Promise<User> {
    const response = await apiClient.post<ApiEnvelope<{ user: User }>>(`${this.basePath}/${id}/disable`);
    return response.data.user;
  }

  async changeRole(id: string, input: ChangeRoleInput): Promise<User> {
    const response = await apiClient.post<ApiEnvelope<{ user: User }>>(`${this.basePath}/${id}/change-role`, input);
    return response.data.user;
  }

  async resetPassword(id: string, input: ResetPasswordInput): Promise<User> {
    const response = await apiClient.post<ApiEnvelope<{ user: User }>>(`${this.basePath}/${id}/reset-password`, input);
    return response.data.user;
  }
}

export const userService = new UserService();
export { UserService };