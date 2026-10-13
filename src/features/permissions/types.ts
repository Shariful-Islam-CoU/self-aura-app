export interface Permission {
  key: string;
  module: string;
  action: string;
  description?: string;
}

export interface PermissionCategory {
  module: string;
  permissions: Permission[];
}

export interface PermissionListResponse {
  categories: PermissionCategory[];
  total: number;
}