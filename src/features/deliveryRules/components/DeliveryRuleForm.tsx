import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getErrorMessage } from '@/api';
import { Button, Input, Switch, Text } from '@/components/ui';
import { SectionCard } from '@/features/customers/components/SectionCard';
import { spacing } from '@/theme';
import type { CreateDeliveryRuleInput, DeliveryRule } from '../types';

export interface DeliveryRuleFormProps {
  mode: 'create' | 'edit';
  rule?: DeliveryRule | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateDeliveryRuleInput) => Promise<void>;
  onCancel: () => void;
}

interface DeliveryRuleFormErrors {
  name?: string;
  price?: string;
  estimatedMinDays?: string;
  estimatedMaxDays?: string;
  sortOrder?: string;
}

/**
 * Create/edit delivery-rule form. Validation mirrors the backend schema
 * (`createDeliveryRuleSchema` / `updateDeliveryRuleSchema`): name required and
 * <= 100 chars, price >= 0 (0 = FREE), min days a whole number >= 0, max days a
 * whole number >= 1 and never below the minimum, sort order a whole number
 * >= 0. The server re-validates and its message is surfaced verbatim.
 */
export function DeliveryRuleForm({
  mode,
  rule,
  isSubmitting,
  onSubmit,
  onCancel,
}: DeliveryRuleFormProps) {
  const isEdit = mode === 'edit' && Boolean(rule);

  const [name, setName] = useState(isEdit && rule ? rule.name : '');
  const [price, setPrice] = useState(isEdit && rule ? String(rule.price) : '0');
  const [minDays, setMinDays] = useState(isEdit && rule ? String(rule.estimatedMinDays) : '1');
  const [maxDays, setMaxDays] = useState(isEdit && rule ? String(rule.estimatedMaxDays) : '3');
  const [sortOrder, setSortOrder] = useState(isEdit && rule ? String(rule.sortOrder) : '0');
  const [isActive, setIsActive] = useState(isEdit && rule ? rule.isActive : true);

  const [errors, setErrors] = useState<DeliveryRuleFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): DeliveryRuleFormErrors => {
    const next: DeliveryRuleFormErrors = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      next.name = 'Name is required.';
    } else if (trimmedName.length > 100) {
      next.name = 'Name must be at most 100 characters.';
    }

    const parsedPrice = Number(price.trim() === '' ? '0' : price.trim());
    if (!Number.isFinite(parsedPrice)) {
      next.price = 'Price must be a number.';
    } else if (parsedPrice < 0) {
      next.price = 'Price cannot be negative.';
    }

    const parsedMin = Number(minDays.trim());
    if (!Number.isInteger(parsedMin) || parsedMin < 0) {
      next.estimatedMinDays = 'Minimum days must be a whole number of 0 or more.';
    }

    const parsedMax = Number(maxDays.trim());
    if (!Number.isInteger(parsedMax) || parsedMax < 1) {
      next.estimatedMaxDays = 'Maximum days must be a whole number of at least 1.';
    } else if (Number.isInteger(parsedMin) && parsedMax < parsedMin) {
      next.estimatedMaxDays = 'Maximum days cannot be less than minimum days.';
    }

    const parsedSort = Number(sortOrder.trim() === '' ? '0' : sortOrder.trim());
    if (!Number.isInteger(parsedSort) || parsedSort < 0) {
      next.sortOrder = 'Sort order must be a whole number of 0 or more.';
    }

    return next;
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const payload: CreateDeliveryRuleInput = {
      name: name.trim(),
      price: Number(price.trim() === '' ? '0' : price.trim()),
      estimatedMinDays: Number(minDays.trim()),
      estimatedMaxDays: Number(maxDays.trim()),
      sortOrder: Number(sortOrder.trim() === '' ? '0' : sortOrder.trim()),
      isActive,
    };

    setSubmitError(null);
    try {
      await onSubmit(payload);
    } catch (error) {
      // The backend stays authoritative (duplicate/validation) - surface its
      // own message instead of faking success.
      setSubmitError(getErrorMessage(error));
    }
  };

  return (
    <View style={styles.container}>
      {submitError ? (
        <Text variant="bodySmall" tone="danger" accessibilityRole="alert">
          {submitError}
        </Text>
      ) : null}

      <SectionCard title="Rule details">
        <Input
          label="Name"
          required
          maxLength={100}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          error={errors.name}
          placeholder="e.g. Inside Dhaka"
          editable={!isSubmitting}
        />
        <Input
          label="Price"
          value={price}
          onChangeText={(text) => {
            setPrice(text);
            setErrors((prev) => ({ ...prev, price: undefined }));
          }}
          error={errors.price}
          placeholder="0"
          keyboardType="decimal-pad"
          editable={!isSubmitting}
          helperText="Enter 0 for a free delivery option."
        />
        <Input
          label="Minimum days"
          value={minDays}
          onChangeText={(text) => {
            setMinDays(text);
            setErrors((prev) => ({ ...prev, estimatedMinDays: undefined }));
          }}
          error={errors.estimatedMinDays}
          keyboardType="number-pad"
          editable={!isSubmitting}
        />
        <Input
          label="Maximum days"
          value={maxDays}
          onChangeText={(text) => {
            setMaxDays(text);
            setErrors((prev) => ({ ...prev, estimatedMaxDays: undefined }));
          }}
          error={errors.estimatedMaxDays}
          keyboardType="number-pad"
          editable={!isSubmitting}
        />
        <Input
          label="Sort order"
          value={sortOrder}
          onChangeText={(text) => {
            setSortOrder(text);
            setErrors((prev) => ({ ...prev, sortOrder: undefined }));
          }}
          error={errors.sortOrder}
          keyboardType="number-pad"
          editable={!isSubmitting}
          helperText="Lower values appear first when prices are equal."
        />
      </SectionCard>

      <SectionCard title="Visibility">
        <Switch
          value={isActive}
          onValueChange={setIsActive}
          label="Active"
          disabled={isSubmitting}
        />
        <Text variant="caption" tone="muted">
          Inactive rules are hidden from checkout but stay on past orders.
        </Text>
      </SectionCard>

      <View style={styles.actions}>
        <Button title="Cancel" variant="outline" onPress={onCancel} style={styles.action} />
        <Button
          title={mode === 'create' ? 'Create rule' : 'Save changes'}
          onPress={() => void handleSubmit()}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
});
