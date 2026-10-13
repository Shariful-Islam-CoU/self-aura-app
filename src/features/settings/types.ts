/**
 * Settings types mirroring the backend Settings API contract exactly
 * (controllers/*SettingsController.ts + validators/settingsValidators.ts).
 * Nothing is invented.
 *
 * Backend surface (routes/settings.routes.ts):
 *   MANAGEMENT (authenticate + requirePermission):
 *     GET    /management/settings/business     get business settings
 *     PATCH  /management/settings/business     update business settings
 *     GET    /management/settings/app          get application settings (array)
 *     PATCH  /management/settings/app          upsert application setting
 *     GET    /management/settings/payments     get payment settings
 *     PATCH  /management/settings/payments     update payment settings
 */

export interface BusinessSettings {
  currency: string;
  timezone: string;
  taxRate: number;
  lowStockAlertThreshold: number | null;
  allowNegativeStock: boolean;
  updatedAt: string;
}

export interface ApplicationSetting {
  _id: string;
  name: string;
  value: unknown;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentChannelSettings {
  enabled: boolean;
  number?: string;
}

export interface PaymentSettings {
  bkash: PaymentChannelSettings;
  nagad: PaymentChannelSettings;
  cod: { enabled: boolean };
}

export interface BusinessSettingsUpdateInput {
  currency?: string;
  timezone?: string;
  taxRate?: number;
  lowStockAlertThreshold?: number;
  allowNegativeStock?: boolean;
}

export interface ApplicationSettingsUpdateInput {
  name: string;
  value: unknown;
  description?: string;
}

export interface PaymentSettingsUpdateInput {
  bkash?: { enabled?: boolean; number?: string };
  nagad?: { enabled?: boolean; number?: string };
  cod?: { enabled?: boolean };
}