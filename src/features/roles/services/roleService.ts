import { apiClient, type ApiEnvelope } from '@/api';

import type {
  CreateRoleInput,
  Role,
  RoleListData,
  RoleListParams,
  UpdateRoleInput,
  UpdateRolePermissionsInput,
} from '../types';

interface RoleListResponse {
  items: Role[];
  pagination: RoleListData['pagination'];
}

class RoleService {
  private readonly basePath = '/management/roles';

  async list(params: RoleListParams = {}): Promise<RoleListData> {
    const query: Record<string, string | number | boolean | undefined> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
      isActive: params.isActive,
      isSystem: params.isSystem,
    };
    const response = await apiClient.get<ApiEnvelope<RoleListResponse>>(this.basePath, { params: query });
    return { roles: response.data.items, pagination: response.data.pagination };
  }

  async getById(id: string): Promise<Role> {
    const response = await apiClient.get<ApiEnvelope<{ role: Role }>>(`${this.basePath}/${id}`);
    return response.data.role;
  }

  async create(input: CreateRoleInput): Promise<Role> {
    const response = await apiClient.post<ApiEnvelope<{ role: Role }>>(this.basePath, input);
    return response.data.role;
  }

  async update(id: string, input: UpdateRoleInput): Promise<Role> {
    const response = await apiClient.patch<ApiEnvelope<{ role: Role }>>(`${this.basePath}/${id}`, input);
    return response.data.role;
  }

  async updatePermissions(id: string, input: UpdateRolePermissionsInput): Promise<Role> {
    const response = await apiClient.put<ApiEnvelope<{ role: Role }>>(`${this.basePath}/${id}/permissions`, input);
    return response.data.role;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<ApiEnvelope<{ success: boolean }>>(`${this.basePath}/${id}`);
    return response.data;
  }
}

export const roleService = new RoleService();
export { RoleService };