export type CourierProvider = 'manual' | 'steadfast';

export interface Courier {
  id: string;
  name: string;
  phone?: string;
  website?: string;
  contactPerson?: string;
  address?: string;
  notes?: string;
  provider?: CourierProvider;
  /** Effective credentials: true when stored keys decrypt or env keys exist. */
  hasCredentials?: boolean;
  credentialsSource?: 'courier' | 'environment';
  /**
   * Where riders collect from, as the courier's panel knows it. Required
   * before a pickup request can be made.
   */
  pickup?: {
    addressId: string;
    policeStationId: string;
    address: string;
    contactNumber: string;
  };
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
  provider?: CourierProvider;
  phone?: string;
  website?: string;
  contactPerson?: string;
  address?: string;
  notes?: string;
  /** Pickup address ids come from the courier's own panel. */
  pickup?: {
    addressId: string;
    policeStationId: string;
    address: string;
    contactNumber: string;
  };
}

export type UpdateCourierData = Partial<CreateCourierData>;
