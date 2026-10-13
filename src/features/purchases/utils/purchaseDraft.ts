/**
 * Helpers for the purchase form draft items.
 * These exist purely for the client-side form state - the backend
 * computes all authoritative totals on create/update/receive.
 */

export function nextDraftKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toDraftPurchaseItem(
  item: {
    id: string;
    product: { id: string };
    productName: string;
    sku: string;
    unitCost: number;
    quantity: number;
  },
  key?: string,
): {
  key: string;
  productId: string;
  productName: string;
  sku: string;
  unitCost: string;
  quantity: string;
} {
  return {
    key: key ?? nextDraftKey('purchase'),
    productId: item.product.id,
    productName: item.productName,
    sku: item.sku,
    unitCost: String(item.unitCost),
    quantity: String(item.quantity),
  };
}

export interface DraftTotals {
  subtotal: number;
  additionalCost: number;
  total: number;
}

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export function calcDraftTotals(
  items: { unitCost: string; quantity: string }[],
  additionalCost: string,
): DraftTotals {
  const itemsSubtotal = items.reduce((sum, item) => {
    const cost = Number(item.unitCost) || 0;
    const qty = Number(item.quantity) || 0;
    return sum + cost * qty;
  }, 0);
  const addCost = Number(additionalCost) || 0;
  const subtotal = round2(itemsSubtotal);
  return {
    subtotal,
    additionalCost: round2(addCost),
    total: round2(subtotal + addCost),
  };
}
