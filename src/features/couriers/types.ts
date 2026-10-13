export interface Courier {
  id: string;
  name: string;
  phone?: string;
  website?: string;
  contactPerson?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourierPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CourierListData {
  couriers: Courier[];
  pagination: CourierPagination;
}

export interface CourierListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'name' | 'phone';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCourierData {
  name: string;
  phone?: string;
  website?: string;
  contactPerson?: string;
  address?: string;
  notes?: string;
}

export type UpdateCourierData = Partial<CreateCourierData>;
