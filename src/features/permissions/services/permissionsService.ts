import { apiClient, type ApiEnvelope } from '@/api';

import type { PermissionListResponse } from '../types';

class PermissionsService {
  private readonly basePath = '/permissions';

  async list(): Promise<PermissionListResponse> {
    const response = await apiClient.get<ApiEnvelope<PermissionListResponse>>(this.basePath);
    return response.data;
  }
}

export const permissionsService = new PermissionsService();
export { PermissionsService };