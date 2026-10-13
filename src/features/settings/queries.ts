import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { settingsService } from './services/settingsService';
import type {
  BusinessSettings,
  ApplicationSetting,
  PaymentSettings,
  BusinessSettingsUpdateInput,
  ApplicationSettingsUpdateInput,
  PaymentSettingsUpdateInput,
} from './types';

export function useBusinessSettings() {
  return useQuery({
    queryKey: ['settings', 'business'],
    queryFn: () => settingsService.getBusinessSettings(),
    staleTime: 30_000,
  });
}

export function useApplicationSettings() {
  return useQuery({
    queryKey: ['settings', 'app'],
    queryFn: () => settingsService.getApplicationSettings(),
    staleTime: 30_000,
  });
}

export function usePaymentSettings() {
  return useQuery({
    queryKey: ['settings', 'payments'],
    queryFn: () => settingsService.getPaymentSettings(),
    staleTime: 30_000,
  });
}

function useSettingsMutation<TVars, TData>(mutationFn: (vars: TVars) => Promise<TData>, queryKey: string[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateBusinessSettings() {
  return useSettingsMutation<BusinessSettingsUpdateInput, BusinessSettings>(
    (input) => settingsService.updateBusinessSettings(input),
    ['settings', 'business']
  );
}

export function useUpdateApplicationSetting() {
  return useSettingsMutation<ApplicationSettingsUpdateInput, ApplicationSetting>(
    (input) => settingsService.updateApplicationSetting(input),
    ['settings', 'app']
  );
}

export function useUpdatePaymentSettings() {
  return useSettingsMutation<PaymentSettingsUpdateInput, PaymentSettings>(
    (input) => settingsService.updatePaymentSettings(input),
    ['settings', 'payments']
  );
}