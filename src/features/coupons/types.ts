export const COUPON_TYPES = ['percentage', 'fixed_amount'] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const COUPON_SCOPES = ['all_products', 'specific_products', 'specific_categories'] as const;
export type CouponScope = (typeof COUPON_SCOPES)[number];

export const COUPON_STATUSES = ['active', 'inactive', 'upcoming', 'expired'] as const;
export type CouponStatus = (typeof COUPON_STATUSES)[number];

export interface CouponProductRef {
  id: string;
  name?: string;
  sku?: string;
}

export interface CouponCategoryRef {
  id: string;
  name?: string;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minimumOrderAmount: number;
  maximumDiscountAmount?: number;
  usageLimit: number;
  usageLimitPerCustomer: number;
  usedCount: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  isSystem?: boolean;
  scope: CouponScope;
  applicableProducts: CouponProductRef[];
  applicableCategories: CouponCategoryRef[];
  excludedProducts: CouponProductRef[];
  excludedCategories: CouponCategoryRef[];
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CouponPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CouponListData {
  coupons: Coupon[];
  pagination: CouponPagination;
}

export interface CouponListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  type?: CouponType;
  status?: CouponStatus;
  sortBy?: 'createdAt' | 'code' | 'name' | 'endAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCouponInput {
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
  startAt: string;
  endAt: string;
  isActive?: boolean;
  scope?: CouponScope;
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
  excludedCategories?: string[];
}

export type UpdateCouponInput = Partial<CreateCouponInput>;

export interface ToggleCouponStatusInput {
  isActive: boolean;
}