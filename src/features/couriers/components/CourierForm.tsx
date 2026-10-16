import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getErrorMessage } from '@/api';
import { Button, Input, Text } from '@/components/ui';
import { SectionCard } from '@/features/customers/components/SectionCard';
import { spacing } from '@/theme';
import type { CreateCourierData, Courier, UpdateCourierData } from '../types';

export interface CourierFormProps {
  mode: 'create' | 'edit';
  courier?: Courier | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateCourierData | UpdateCourierData) => Promise<void>;
  onCancel: () => void;
}

interface CourierFormErrors {
  name?: string;
  contactPerson?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
}

/**
 * Create/edit courier form. Validation mirrors the backend schema
 * (`courierValidators`): name required and <= 100 chars; optional fields kept
 * within the backend limits. Empty optional values are sent as `undefined`,
 * matching the backend's empty-to-undefined transform.
 */
export function CourierForm({
  mode,
  courier,
  isSubmitting,
  onSubmit,
  onCancel,
}: CourierFormProps) {
  const isEdit = mode === 'edit' && Boolean(courier);

  const [name, setName] = useState(isEdit && courier ? courier.name : '');
  const [contactPerson, setContactPerson] = useState(isEdit && courier ? (courier.contactPerson ?? '') : '');
  const [phone, setPhone] = useState(isEdit && courier ? (courier.phone ?? '') : '');
  const [website, setWebsite] = useState(isEdit && courier ? (courier.website ?? '') : '');
  const [address, setAddress] = useState(isEdit && courier ? (courier.address ?? '') : '');
  const [notes, setNotes] = useState(isEdit && courier ? (courier.notes ?? '') : '');

  const [errors, setErrors] = useState<CourierFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): CourierFormErrors => {
    const next: CourierFormErrors = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      next.name = 'Name is required.';
    } else if (trimmedName.length > 100) {
      next.name = 'Name must be at most 100 characters.';
    }
    if (contactPerson.trim().length > 100) {
      next.contactPerson = 'Must be at most 100 characters.';
    }
    if (phone.trim().length > 32) {
      next.phone = 'Must be at most 32 characters.';
    }
    if (website.trim().length > 200) {
      next.website = 'Must be at most 200 characters.';
    }
    if (address.trim().length > 500) {
      next.address = 'Must be at most 500 characters.';
    }
    if (notes.trim().length > 2000) {
      next.notes = 'Must be at most 2000 characters.';
    }

    return next;
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const payload: CreateCourierData = {
      name: name.trim(),
      contactPerson: contactPerson.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    setSubmitError(null);
    try {
      await onSubmit(payload);
    } catch (error) {
      // Backend stays authoritative (duplicate/validation) - surface its own
      // message instead of faking success.
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

      <SectionCard title="Courier profile">
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
          placeholder="e.g. Sundarban Courier"
          editable={!isSubmitting}
        />
        <Input
          label="Contact person"
          maxLength={100}
          value={contactPerson}
          onChangeText={(text) => {
            setContactPerson(text);
            setErrors((prev) => ({ ...prev, contactPerson: undefined }));
          }}
          error={errors.contactPerson}
          editable={!isSubmitting}
        />
        <Input
          label="Phone"
          maxLength={32}
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            setErrors((prev) => ({ ...prev, phone: undefined }));
          }}
          error={errors.phone}
          keyboardType="phone-pad"
          editable={!isSubmitting}
        />
        <Input
          label="Website"
          maxLength={200}
          value={website}
          onChangeText={(text) => {
            setWebsite(text);
            setErrors((prev) => ({ ...prev, website: undefined }));
          }}
          error={errors.website}
          placeholder="https://example.com"
          autoCapitalize="none"
          keyboardType="url"
          editable={!isSubmitting}
        />
        <Input
          label="Address"
          maxLength={500}
          value={address}
          onChangeText={setAddress}
          error={errors.address}
          multiline
          numberOfLines={3}
          editable={!isSubmitting}
        />
        <Input
          label="Notes"
          maxLength={2000}
          value={notes}
          onChangeText={setNotes}
          error={errors.notes}
          multiline
          numberOfLines={4}
          editable={!isSubmitting}
          helperText="Internal notes are never shown to customers."
        />
      </SectionCard>

      <View style={styles.actions}>
        <Button title="Cancel" variant="outline" onPress={onCancel} style={styles.action} />
        <Button
          title={mode === 'create' ? 'Create courier' : 'Save changes'}
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
