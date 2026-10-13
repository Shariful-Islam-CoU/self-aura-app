import { apiClient, type ApiEnvelope } from '@/api';

import type {
  BusinessSettings,
  ApplicationSetting,
  PaymentSettings,
  BusinessSettingsUpdateInput,
  ApplicationSettingsUpdateInput,
  PaymentSettingsUpdateInput,
} from '../types';

class SettingsService {
  async getBusinessSettings(): Promise<BusinessSettings> {
    const response = await apiClient.get<ApiEnvelope<BusinessSettings>>('/management/settings/business');
    return response.data;
  }

  async updateBusinessSettings(input: BusinessSettingsUpdateInput): Promise<BusinessSettings> {
    const response = await apiClient.patch<ApiEnvelope<BusinessSettings>>('/management/settings/business', input);
    return response.data;
  }

  async getApplicationSettings(): Promise<ApplicationSetting[]> {
    const response = await apiClient.get<ApiEnvelope<ApplicationSetting[]>>('/management/settings/app');
    return response.data;
  }

  async updateApplicationSetting(input: ApplicationSettingsUpdateInput): Promise<ApplicationSetting> {
    const response = await apiClient.patch<ApiEnvelope<ApplicationSetting>>('/management/settings/app', input);
    return response.data;
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    const response = await apiClient.get<ApiEnvelope<PaymentSettings>>('/management/settings/payments');
    return response.data;
  }

  async updatePaymentSettings(input: PaymentSettingsUpdateInput): Promise<PaymentSettings> {
    const response = await apiClient.patch<ApiEnvelope<PaymentSettings>>('/management/settings/payments', input);
    return response.data;
  }
}

export const settingsService = new SettingsService();
export { SettingsService };