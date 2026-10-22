import { apiClient, type ApiEnvelope } from '@/api';
import type { PublicDeliveryRule } from '../types';

/**
 * Delivery rule service - the active delivery options an order can be priced
 * with (mirrors `self_aura_frontend`'s deliveryRuleService).
 *
 * Endpoints:
 *   GET /delivery-rules/customer/delivery-rules - active rules (public, simplified)
 *
 * The PUBLIC endpoint is used deliberately, not `/management/delivery-rules`:
 * it returns exactly the active-rule list the storefront checkout shows (one
 * source of truth for what shoppers see), and it needs no `deliveryRules.view`
 * permission - staff who can create orders can pick a delivery option without
 * being granted the delivery-rules admin module.
 */
class DeliveryRuleService {
  /**
   * Active delivery rules, backend-sorted by price descending (highest
   * first) - the same order the storefront uses to default-select the
   * highest-priced option.
   */
  async fetchActiveDeliveryRules(): Promise<PublicDeliveryRule[]> {
    const res = await apiClient.get<ApiEnvelope<{ rules: PublicDeliveryRule[] }>>(
      '/delivery-rules/customer/delivery-rules'
    );
    return res.data.rules ?? [];
  }
}

export const deliveryRuleService = new DeliveryRuleService();
