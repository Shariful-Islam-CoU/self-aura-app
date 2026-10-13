/** Purchase status constants - mirrors backend `src/constants/purchase.ts`. */
export const PURCHASE_STATUSES = ['draft', 'received', 'cancelled'] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

/** Purchase number prefix for display context (not used for generation - backend does that). */
export const PURCHASE_NUMBER_PREFIX = 'PUR';
