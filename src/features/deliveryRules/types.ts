/**
 * Delivery rule types mirroring the backend contract exactly
 * (`validators/deliveryRuleValidators.ts` + `controllers/deliveryRuleController.ts`).
 *
 * Management base: `/delivery-rules/management/delivery-rules`. Unlike coupons
 * (whose controller maps Mongo docs to `id`), the delivery-rule controller
 * returns the raw document, so the identifier field is the Mongo `_id` -
 * mirrored verbatim, nothing is invented or renamed.
 *
 * A delivery rule is a flat, self-selectable checkout option: a name, a price
 * (0 = FREE) and a delivery estimate. There is no geographic matching - the
 * customer picks one at checkout.
 */

export interface DeliveryRule {
  _id: string;
  name: string;
  price: number;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryRulePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DeliveryRuleListData {
  items: DeliveryRule[];
  pagination: DeliveryRulePagination;
}

/** Server-side list query (`listDeliveryRulesQuerySchema`). */
export interface DeliveryRuleListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'name' | 'price' | 'sortOrder';
  sortOrder?: 'asc' | 'desc';
}

/** POST body (`createDeliveryRuleSchema`). */
export interface CreateDeliveryRuleInput {
  name: string;
  price: number;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  sortOrder?: number;
  isActive?: boolean;
}

/** PATCH body (`updateDeliveryRuleSchema` - every field optional). */
export type UpdateDeliveryRuleInput = Partial<CreateDeliveryRuleInput>;

/** PATCH `/.../:id/toggle` body (`toggleDeliveryRuleStatusSchema`). */
export interface ToggleDeliveryRuleStatusInput {
  isActive: boolean;
}
