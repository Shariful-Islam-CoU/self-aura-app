import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getErrorMessage, isApiError } from '@/api';
import { Button, Checkbox, IconButton, Input, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { radius, spacing } from '@/theme';
import type {
  CreateCustomerInput,
  Customer,
  CustomerAddressInput,
  UpdateCustomerInput,
} from '../types';

/**
 * Shared create/edit customer form.
 *
 * Field rules mirror the backend's `createCustomerSchema` /
 * `updateCustomerSchema` (and the web app's CustomerForm) for fast local
 * feedback - the backend re-validates everything and its response stays
 * authoritative: server field errors (`ApiError.errors`) are mapped back
 * onto the fields, anything else surfaces as a form-level message.
 * Passwords are never involved (customer records have no app-visible
 * credentials), and no customer data leaves this component except through
 * `onSubmit`.
 */

const MAX_ADDRESSES = 20;
const MAX_TAGS = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Backend `facebookProfileUrlSchema` refine - a valid Facebook URL only. */
const FACEBOOK_URL_PATTERNS = [
  /^(https?:\/\/)(www\.)?facebook\.com\//,
  /^(https?:\/\/)m\.facebook\.com\//,
  /^(https?:\/\/)(www\.)?fb\.com\//,
  /^https?:\/\/(www\.)?facebook\.com\/profile\.php/i,
  /^https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9_.-]+/i,
];

const phoneDigits = (value: string): string => value.replace(/\D/g, '');
const isValidPhone = (value: string): boolean => {
  const digits = phoneDigits(value);
  return digits.length >= 7 && digits.length <= 15;
};

const splitTags = (raw: string): string[] =>
  raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

interface AddressFormValues {
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  area: string;
  district: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface CustomerFormValues {
  name: string;
  phone: string;
  alternatePhone: string;
  email: string;
  facebookName: string;
  facebookProfileUrl: string;
  tags: string;
  notes: string;
  addresses: AddressFormValues[];
}

interface FieldErrors {
  name?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  facebookName?: string;
  facebookProfileUrl?: string;
  tags?: string;
  notes?: string;
  addresses?: string;
}

export interface CustomerFormProps {
  mode: 'create' | 'edit';
  /** Preloaded customer for edit - the screen only mounts the form once it is loaded. */
  initialValues?: Customer | null;
  isSubmitting: boolean;
  onSubmit: (values: CreateCustomerInput | UpdateCustomerInput) => Promise<void>;
  onCancel: () => void;
}

const emptyAddress = (): AddressFormValues => ({
  label: 'Home',
  recipientName: '',
  phone: '',
  addressLine: '',
  area: '',
  district: '',
  city: '',
  postalCode: '',
  country: '',
  isDefault: false,
});

const isBlankAddress = (address: AddressFormValues): boolean =>
  !address.recipientName.trim() &&
  !address.phone.trim() &&
  !address.addressLine.trim() &&
  !address.area.trim() &&
  !address.district.trim() &&
  !address.city.trim() &&
  !address.postalCode.trim() &&
  !address.country.trim();

export function CustomerForm({
  mode,
  initialValues,
  isSubmitting,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const { theme } = useTheme();
  const isEdit = mode === 'edit';

  const [values, setValues] = useState<CustomerFormValues>(() => ({
    name: initialValues?.name ?? '',
    phone: initialValues?.phone ?? '',
    alternatePhone: initialValues?.alternatePhone ?? '',
    email: initialValues?.email ?? '',
    facebookName: initialValues?.facebookName ?? '',
    facebookProfileUrl: initialValues?.facebookProfileUrl ?? '',
    tags: initialValues?.tags.join(', ') ?? '',
    notes: initialValues?.notes ?? '',
    addresses:
      initialValues?.addresses.map((address) => ({
        label: address.label,
        recipientName: address.recipientName ?? '',
        phone: address.phone ?? '',
        addressLine: address.addressLine,
        area: address.area ?? '',
        district: address.district ?? '',
        city: address.city ?? '',
        postalCode: address.postalCode ?? '',
        country: address.country ?? '',
        isDefault: address.isDefault,
      })) ?? [],
  }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [addressErrors, setAddressErrors] = useState<(string | null)[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = <K extends keyof CustomerFormValues>(
    field: K,
    value: CustomerFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const updateAddress = (
    index: number,
    field: keyof AddressFormValues,
    value: string | boolean,
  ) => {
    setValues((prev) => ({
      ...prev,
      addresses: prev.addresses.map((address, addressIndex) =>
        addressIndex === index ? { ...address, [field]: value } : address,
      ),
    }));
    setAddressErrors((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setFieldErrors((prev) => ({ ...prev, addresses: undefined }));
    setFormError(null);
  };

  const setDefaultAddress = (index: number, checked: boolean) => {
    setValues((prev) => ({
      ...prev,
      addresses: prev.addresses.map((address, addressIndex) => ({
        ...address,
        isDefault: addressIndex === index ? checked : checked ? false : address.isDefault,
      })),
    }));
  };

  const addAddress = () => {
    setValues((prev) =>
      prev.addresses.length >= MAX_ADDRESSES
        ? prev
        : { ...prev, addresses: [...prev.addresses, emptyAddress()] },
    );
    setAddressErrors((prev) => [...prev, null]);
  };

  const removeAddress = (index: number) => {
    setValues((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((_, addressIndex) => addressIndex !== index),
    }));
    setAddressErrors((prev) => prev.filter((_, addressIndex) => addressIndex !== index));
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const name = values.name.trim();
    const phone = values.phone.trim();
    const alternatePhone = values.alternatePhone.trim();
    const email = values.email.trim();
    const tags = splitTags(values.tags);

    if (!name) {
      errors.name = 'Customer name is required';
    } else if (name.length > 100) {
      errors.name = 'Customer name must be at most 100 characters';
    }

    if (!phone) {
      errors.phone = 'Phone is required';
    } else if (phone.length > 32) {
      errors.phone = 'Phone must be at most 32 characters';
    } else if (!isValidPhone(phone)) {
      errors.phone = 'Phone must contain a valid phone number (7-15 digits)';
    }

    if (alternatePhone) {
      if (alternatePhone.length > 32) {
        errors.alternatePhone = 'Alternate phone must be at most 32 characters';
      } else if (!isValidPhone(alternatePhone)) {
        errors.alternatePhone = 'Alternate phone must contain a valid phone number (7-15 digits)';
      }
    }

    if (email) {
      if (email.length > 254) {
        errors.email = 'Email must be at most 254 characters';
      } else if (!EMAIL_PATTERN.test(email)) {
        errors.email = 'Email must be a valid email address';
      }
    }

    if (values.facebookName.trim().length > 120) {
      errors.facebookName = 'Facebook name must be at most 120 characters';
    }

    const fbUrl = values.facebookProfileUrl.trim();
    if (fbUrl && !FACEBOOK_URL_PATTERNS.some((pattern) => pattern.test(fbUrl))) {
      errors.facebookProfileUrl = 'Facebook profile URL must be a valid Facebook URL';
    }

    if (values.notes.trim().length > 2000) {
      errors.notes = 'Notes must be at most 2000 characters';
    }

    if (tags.length > MAX_TAGS) {
      errors.tags = 'A customer may have at most 20 tags';
    } else if (tags.some((tag) => tag.length > 30)) {
      errors.tags = 'Tag must be at most 30 characters';
    }

    const newAddressErrors: (string | null)[] = values.addresses.map((address, index) => {
      if (isBlankAddress(address)) return null;
      let message: string | null = null;
      if (address.label.trim().length > 50) {
        message = 'Label must be at most 50 characters';
      } else if (address.recipientName.trim().length > 100) {
        message = 'Recipient name must be at most 100 characters';
      } else if (address.phone.trim() && !isValidPhone(address.phone.trim())) {
        message = 'Phone must contain a valid phone number (7-15 digits)';
      } else if (!address.addressLine.trim()) {
        message = 'Address line is required';
      } else if (address.addressLine.trim().length > 200) {
        message = 'Address line must be at most 200 characters';
      } else if (address.area.trim().length > 100) {
        message = 'Area must be at most 100 characters';
      } else if (!address.district.trim()) {
        message = 'District is required';
      } else if (address.district.trim().length > 100) {
        message = 'District must be at most 100 characters';
      } else if (address.city.trim().length > 100) {
        message = 'City must be at most 100 characters';
      } else if (address.postalCode.trim().length > 20) {
        message = 'Postal code must be at most 20 characters';
      } else if (address.country.trim().length > 100) {
        message = 'Country must be at most 100 characters';
      }
      if (message) {
        errors.addresses = 'Please review the address details below.';
        return `Address ${index + 1}: ${message}`;
      }
      return null;
    });

    setAddressErrors(newAddressErrors);

    if (values.addresses.length > MAX_ADDRESSES) {
      errors.addresses = 'A customer may have at most 20 addresses';
    } else if (values.addresses.filter((address) => address.isDefault).length > 1) {
      errors.addresses = 'Only one address can be the default address';
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (
      errors.name ||
      errors.phone ||
      errors.alternatePhone ||
      errors.email ||
      errors.facebookName ||
      errors.facebookProfileUrl ||
      errors.tags ||
      errors.notes ||
      errors.addresses
    ) {
      setFieldErrors(errors);
      setFormError(null);
      return;
    }

    const filledAddresses = values.addresses.filter((address) => !isBlankAddress(address));
    const addressesPayload: CustomerAddressInput[] = filledAddresses.map((address) => ({
      label: address.label.trim() || 'Home',
      recipientName: address.recipientName.trim() || undefined,
      phone: address.phone.trim() || undefined,
      addressLine: address.addressLine.trim(),
      area: address.area.trim() || undefined,
      district: address.district.trim(),
      city: address.city.trim() || undefined,
      postalCode: address.postalCode.trim() || undefined,
      country: address.country.trim() || undefined,
      isDefault: address.isDefault,
    }));

    // Empty optional fields clear the stored value on edit (null) and are
    // omitted on create - exactly the web form's payload shape.
    const payload: CreateCustomerInput | UpdateCustomerInput = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      alternatePhone: values.alternatePhone.trim() || (isEdit ? null : undefined),
      email: values.email.trim().toLowerCase() || (isEdit ? null : undefined),
      facebookName: values.facebookName.trim() || (isEdit ? null : undefined),
      facebookProfileUrl: values.facebookProfileUrl.trim() || (isEdit ? null : undefined),
      addresses: addressesPayload.length ? addressesPayload : isEdit ? null : undefined,
      notes: values.notes.trim() || (isEdit ? null : undefined),
      tags: splitTags(values.tags),
    };

    setFormError(null);
    try {
      await onSubmit(payload);
    } catch (error) {
      if (isApiError(error) && error.errors) {
        const serverErrors = error.errors;
        const next: FieldErrors = {};
        if (serverErrors.name) next.name = serverErrors.name[0];
        if (serverErrors.phone) next.phone = serverErrors.phone[0];
        if (serverErrors.alternatePhone) next.alternatePhone = serverErrors.alternatePhone[0];
        if (serverErrors.email) next.email = serverErrors.email[0];
        if (serverErrors.facebookName) next.facebookName = serverErrors.facebookName[0];
        if (serverErrors.facebookProfileUrl) {
          next.facebookProfileUrl = serverErrors.facebookProfileUrl[0];
        }
        if (serverErrors.notes) next.notes = serverErrors.notes[0];
        if (serverErrors.tags) next.tags = serverErrors.tags[0];
        setAddressErrors(
          values.addresses.map(
            (_, index) =>
              serverErrors[`addresses.${index}.addressLine`]?.[0] ??
              serverErrors[`addresses.${index}.district`]?.[0] ??
              serverErrors[`addresses.${index}.city`]?.[0] ??
              serverErrors[`addresses.${index}.label`]?.[0] ??
              serverErrors[`addresses.${index}.phone`]?.[0] ??
              null,
          ),
        );
        const addressTopError = serverErrors.addresses?.[0];
        const hasFieldError = Object.values(next).some(Boolean);
        if (hasFieldError || addressTopError) {
          if (addressTopError) next.addresses = addressTopError;
          setFieldErrors(next);
          setFormError(null);
          return;
        }
        const addressFieldError = Object.entries(serverErrors).find(([key]) =>
          key.startsWith('addresses.'),
        )?.[1][0];
        if (addressFieldError) {
          setFieldErrors({ addresses: addressFieldError });
          setFormError(null);
          return;
        }
      }
      // Non-field failures (409 duplicate phone, 403, network...) - show the
      // backend's own user-facing message, never a fabricated success.
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <View style={styles.form}>
      <Text variant="label" tone="secondary">
        Identity
      </Text>
      <Input
        label="Full name"
        required
        value={values.name}
        onChangeText={(text) => updateField('name', text)}
        error={fieldErrors.name}
        placeholder="e.g. Rahim Uddin"
        autoComplete="name"
        accessibilityLabel="Customer full name"
      />
      <Input
        label="Phone"
        required
        value={values.phone}
        onChangeText={(text) => updateField('phone', text)}
        error={fieldErrors.phone}
        placeholder="e.g. 01712345678"
        keyboardType="phone-pad"
        accessibilityLabel="Customer phone number"
      />
      <Input
        label="Alternate phone"
        value={values.alternatePhone}
        onChangeText={(text) => updateField('alternatePhone', text)}
        error={fieldErrors.alternatePhone}
        placeholder="Optional"
        keyboardType="phone-pad"
        accessibilityLabel="Customer alternate phone number"
      />
      <Input
        label="Email"
        value={values.email}
        onChangeText={(text) => updateField('email', text)}
        error={fieldErrors.email}
        placeholder="Optional"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        accessibilityLabel="Customer email address"
      />

      <Text variant="label" tone="secondary">
        Social information
      </Text>
      <Input
        label="Facebook name"
        value={values.facebookName}
        onChangeText={(text) => updateField('facebookName', text)}
        error={fieldErrors.facebookName}
        placeholder="Optional"
        accessibilityLabel="Customer Facebook name"
      />
      <Input
        label="Facebook profile URL"
        value={values.facebookProfileUrl}
        onChangeText={(text) => updateField('facebookProfileUrl', text)}
        error={fieldErrors.facebookProfileUrl}
        helperText="Must be a facebook.com or fb.com link."
        placeholder="Optional"
        autoCapitalize="none"
        accessibilityLabel="Customer Facebook profile URL"
      />

      <Text variant="label" tone="secondary">
        Notes &amp; tags
      </Text>
      <Input
        label="Tags"
        value={values.tags}
        onChangeText={(text) => updateField('tags', text)}
        error={fieldErrors.tags}
        helperText="Separate with commas - up to 20 tags, 30 characters each."
        placeholder="e.g. vip, wholesale"
        accessibilityLabel="Customer tags, separated by commas"
      />
      <Input
        label="Notes"
        value={values.notes}
        onChangeText={(text) => updateField('notes', text)}
        error={fieldErrors.notes}
        placeholder="Internal notes (optional)"
        multiline
        accessibilityLabel="Customer notes"
      />

      <View style={styles.addressHeader}>
        <Text variant="label" tone="secondary">
          Addresses
        </Text>
        <Text variant="caption" tone="muted">
          {values.addresses.length}/{MAX_ADDRESSES}
        </Text>
      </View>
      {fieldErrors.addresses ? (
        <Text variant="bodySmall" tone="danger">
          {fieldErrors.addresses}
        </Text>
      ) : null}
      {values.addresses.map((address, index) => (
        <View key={index} style={[styles.addressBlock, { borderColor: theme.colors.border }]}>
          <View style={styles.addressTitleRow}>
            <Text variant="bodyMedium">
              Address {index + 1}
              {address.isDefault ? ' · Default' : ''}
            </Text>
            <IconButton
              icon="trash-outline"
              accessibilityLabel={`Remove address ${index + 1}`}
              onPress={() => removeAddress(index)}
            />
          </View>
          {addressErrors[index] ? (
            <Text variant="bodySmall" tone="danger">
              {addressErrors[index]}
            </Text>
          ) : null}
          <Input
            label="Label"
            value={address.label}
            onChangeText={(text) => updateAddress(index, 'label', text)}
            placeholder="Home"
            accessibilityLabel={`Address ${index + 1} label`}
          />
          <Input
            label="Recipient name"
            value={address.recipientName}
            onChangeText={(text) => updateAddress(index, 'recipientName', text)}
            placeholder="Optional"
            accessibilityLabel={`Address ${index + 1} recipient name`}
          />
          <Input
            label="Phone"
            value={address.phone}
            onChangeText={(text) => updateAddress(index, 'phone', text)}
            placeholder="Optional"
            keyboardType="phone-pad"
            accessibilityLabel={`Address ${index + 1} phone`}
          />
          <Input
            label="Address line"
            required
            value={address.addressLine}
            onChangeText={(text) => updateAddress(index, 'addressLine', text)}
            placeholder="House / road, area"
            accessibilityLabel={`Address ${index + 1} address line`}
          />
          <Input
            label="District"
            required
            value={address.district}
            onChangeText={(text) => updateAddress(index, 'district', text)}
            placeholder="e.g. Dhaka"
            accessibilityLabel={`Address ${index + 1} district`}
          />
          <Input
            label="Area"
            value={address.area}
            onChangeText={(text) => updateAddress(index, 'area', text)}
            placeholder="Optional"
            accessibilityLabel={`Address ${index + 1} area`}
          />
          <Input
            label="City"
            value={address.city}
            onChangeText={(text) => updateAddress(index, 'city', text)}
            placeholder="Optional"
            accessibilityLabel={`Address ${index + 1} city`}
          />
          <Input
            label="Postal code"
            value={address.postalCode}
            onChangeText={(text) => updateAddress(index, 'postalCode', text)}
            placeholder="Optional"
            accessibilityLabel={`Address ${index + 1} postal code`}
          />
          <Input
            label="Country"
            value={address.country}
            onChangeText={(text) => updateAddress(index, 'country', text)}
            placeholder="Optional"
            accessibilityLabel={`Address ${index + 1} country`}
          />
          <Checkbox
            label="Default address"
            checked={address.isDefault}
            onCheckedChange={(checked) => setDefaultAddress(index, checked)}
          />
        </View>
      ))}
      <Button
        title="Add address"
        variant="outline"
        icon="add-outline"
        onPress={addAddress}
        disabled={values.addresses.length >= MAX_ADDRESSES}
        accessibilityLabel="Add another address"
      />

      {formError ? (
        <View style={[styles.formError, { borderColor: theme.colors.danger }]}>
          <Text variant="bodySmall" tone="danger">
            {formError}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title={isEdit ? 'Save changes' : 'Create customer'}
          fullWidth
          loading={isSubmitting}
          onPress={() => void handleSubmit()}
          accessibilityLabel={isEdit ? 'Save customer changes' : 'Create customer'}
        />
        <Button
          title="Cancel"
          variant="ghost"
          fullWidth
          disabled={isSubmitting}
          onPress={onCancel}
          accessibilityLabel="Discard and go back"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, paddingBottom: spacing.xxl },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  addressBlock: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  formError: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
