import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getErrorMessage, isApiError } from '@/api';
import { Button, Input, Select, Text } from '@/components/ui';
import { useTheme } from '@/providers';
import { spacing } from '@/theme';
import type { Customer } from '@/features/customers/types';

import { ORDER_PAYMENT_METHOD_OPTIONS, ORDER_SOURCE_OPTIONS } from '../labels';
import { useDeliveryRules } from '../queries';
import type { CreateOrderInput, DraftOrderItem, OrderSource, PaymentMethod } from '../types';
import { DeliveryOptionPicker } from './DeliveryOptionPicker';
import { OrderCustomerPicker } from './OrderCustomerPicker';
import { OrderItemsEditor } from './OrderItemsEditor';
import { SectionCard } from './SectionCard';

/** Backend rule: line items are 1..9999 whole numbers, max 50 per order. */
const MAX_QUANTITY = 9999;

interface ShippingFormValues {
  recipientName: string;
  phone: string;
  addressLine: string;
  area: string;
  district: string;
  city: string;
  postalCode: string;
  country: string;
}

interface OrderFormValues {
  paymentMethod: PaymentMethod;
  source: OrderSource;
  transactionId: string;
  senderPhone: string;
  note: string;
  shippingAddress: ShippingFormValues;
}

/**
 * Field messages keyed by local field name; the string index also carries
 * the per-line-item quantity messages (keyed by draft item key).
 */
interface OrderFormErrors {
  customer?: string;
  items?: string;
  note?: string;
  paymentMethod?: string;
  source?: string;
  transactionId?: string;
  senderPhone?: string;
  recipientName?: string;
  phone?: string;
  addressLine?: string;
  area?: string;
  district?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  [key: string]: string | undefined;
}

export interface OrderFormProps {
  isSubmitting: boolean;
  onSubmit: (input: CreateOrderInput) => Promise<void>;
  onCancel: () => void;
}

/** Backend validation path -> local field name (server field errors). */
const SERVER_FIELD_KEYS: Record<string, keyof OrderFormErrors> = {
  customer: 'customer',
  items: 'items',
  note: 'note',
  paymentMethod: 'paymentMethod',
  source: 'source',
  transactionId: 'transactionId',
  senderPhone: 'senderPhone',
  'shippingAddress.recipientName': 'recipientName',
  'shippingAddress.phone': 'phone',
  'shippingAddress.addressLine': 'addressLine',
  'shippingAddress.area': 'area',
  'shippingAddress.district': 'district',
  'shippingAddress.city': 'city',
  'shippingAddress.postalCode': 'postalCode',
  'shippingAddress.country': 'country',
};

const emptyShippingAddress = (): ShippingFormValues => ({
  recipientName: '',
  phone: '',
  addressLine: '',
  area: '',
  district: '',
  city: '',
  postalCode: '',
  country: 'Bangladesh',
});

/** Mirrors the backend's optional address phone rule (7-15 digits, or empty). */
const isValidPhone = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  return digits.length === 0 || (digits.length >= 7 && digits.length <= 15);
};

/** Mirrors the backend's `senderPhoneSchema` (01XXXXXXXXX or empty). */
const isValidSenderPhone = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  return digits.length === 0 || (digits.length === 11 && digits.startsWith('01'));
};

/**
 * Create-order form (mobile counterpart of the web `OrderForm`).
 *
 * Field rules mirror the backend's `createOrderSchema` for fast local
 * feedback; the backend re-validates everything and stays authoritative -
 * server field errors (`ApiError.errors`) are mapped back onto the fields,
 * anything else surfaces as a form-level message. No money field is ever
 * sent: the server derives prices, coupon discount, delivery charge and
 * total from the items, the validated coupon and the selected delivery
 * rule.
 */
export function OrderForm({ isSubmitting, onSubmit, onCancel }: OrderFormProps) {
  const { theme } = useTheme();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<DraftOrderItem[]>([]);
  const [values, setValues] = useState<OrderFormValues>({
    paymentMethod: 'cash_on_delivery',
    source: 'manual',
    transactionId: '',
    senderPhone: '',
    note: '',
    shippingAddress: emptyShippingAddress(),
  });
  const [fieldErrors, setFieldErrors] = useState<OrderFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Delivery rules: the same active list the storefront checkout shows.
  // `selectedRuleId` only ever holds a USER pick; while it is null the
  // default applies - the first rule, which the backend returns
  // highest-price-first (storefront parity). A fetch failure is non-fatal:
  // the order is then created without a rule and the backend applies its
  // 0-charge fallback.
  const deliveryRulesQuery = useDeliveryRules();
  const deliveryRules = useMemo(() => deliveryRulesQuery.data ?? [], [deliveryRulesQuery.data]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const effectiveRuleId = selectedRuleId ?? deliveryRules[0]?.id ?? null;
  /** The rule whose price the estimate block shows; null when none applies. */
  const effectiveRule = useMemo(
    () => deliveryRules.find((rule) => rule.id === effectiveRuleId) ?? null,
    [deliveryRules, effectiveRuleId]
  );

  const handleSelectRule = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    setDeliveryError(null);
    setFormError(null);
  };

  const isManualPayment = values.paymentMethod === 'bkash' || values.paymentMethod === 'nagad';

  const clearFieldError = (key: keyof OrderFormErrors) => {
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  /**
   * Picking a customer prefills the shipping address from their default
   * saved address, but only while the user has not typed an address
   * themselves - same rule as the web form, and the district is copied
   * as-is (never guessed from area or city).
   */
  const handleSelectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    clearFieldError('customer');
    setFormError(null);
    if (!customer) return;

    const address =
      customer.addresses?.find((entry) => entry.isDefault) ?? customer.addresses?.[0];
    if (!address) return;
    setValues((prev) => {
      const current = prev.shippingAddress;
      if (current.addressLine.trim() || current.district.trim()) return prev;
      return {
        ...prev,
        shippingAddress: {
          recipientName: address.recipientName ?? '',
          phone: address.phone ?? '',
          addressLine: address.addressLine,
          area: address.area ?? '',
          district: address.district ?? current.district,
          city: address.city ?? '',
          postalCode: address.postalCode ?? '',
          country: address.country ?? 'Bangladesh',
        },
      };
    });
  };

  const updateField = <K extends keyof OrderFormValues>(key: K, value: OrderFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearFieldError(key);
    setFormError(null);
  };

  const updateShippingField = (key: keyof ShippingFormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, [key]: value },
    }));
    clearFieldError(key);
    setFormError(null);
  };

  const handleItemsChange = (next: DraftOrderItem[]) => {
    setItems(next);
    // Quantity/item messages are recomputed on the next validate pass.
    setFieldErrors((prev) => {
      const cleaned: OrderFormErrors = { ...prev, items: undefined };
      for (const key of Object.keys(cleaned)) {
        if (key.startsWith('order-item-')) cleaned[key] = undefined;
      }
      return cleaned;
    });
    setFormError(null);
  };

  const validate = (): OrderFormErrors => {
    const next: OrderFormErrors = {};

    if (!selectedCustomer) next.customer = 'Select a customer for the order';

    if (items.length === 0) {
      next.items = 'At least one item is required';
    } else {
      const productIds = new Set(items.map((item) => item.productId));
      if (productIds.size !== items.length) {
        next.items = 'Duplicate products in the same order are not allowed';
      }
      for (const item of items) {
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
          next[item.key] = 'Enter a whole number from 1 to 9999';
        }
      }
    }

    if (isManualPayment) {
      const transactionId = values.transactionId.trim();
      if (!transactionId) {
        next.transactionId = 'Transaction ID is required for bKash/Nagad payments';
      } else if (transactionId.length < 6 || transactionId.length > 200) {
        next.transactionId = 'Transaction ID must be between 6 and 200 characters';
      }
      const senderPhone = values.senderPhone.trim();
      if (senderPhone && !isValidSenderPhone(senderPhone)) {
        next.senderPhone = 'Enter a valid number, e.g. 01XXXXXXXXX';
      }
    }

    const address = values.shippingAddress;
    if (!address.addressLine.trim()) {
      next.addressLine = 'Address line is required';
    } else if (address.addressLine.trim().length > 200) {
      next.addressLine = 'Address line must be at most 200 characters';
    }
    // The backend requires a district (or an area) so the delivery address is
    // complete, and rejects the order without one - guessing it from the city
    // would be wrong. The delivery CHARGE itself comes from the selected rule.
    if (!address.district.trim()) {
      next.district = 'District is required for the delivery address';
    } else if (address.district.trim().length > 100) {
      next.district = 'District must be at most 100 characters';
    }
    if (address.recipientName.trim().length > 100) {
      next.recipientName = 'Recipient name must be at most 100 characters';
    }
    const phone = address.phone.trim();
    if (phone.length > 32) {
      next.phone = 'Phone must be at most 32 characters';
    } else if (!isValidPhone(phone)) {
      next.phone = 'Phone must contain a valid phone number';
    }
    if (address.area.trim().length > 100) {
      next.area = 'Area must be at most 100 characters';
    }
    if (address.city.trim().length > 100) {
      next.city = 'City must be at most 100 characters';
    }
    if (address.postalCode.trim().length > 20) {
      next.postalCode = 'Postal code must be at most 20 characters';
    }
    if (address.country.trim().length > 100) {
      next.country = 'Country must be at most 100 characters';
    }
    if (values.note.trim().length > 2000) {
      next.note = 'Note must be at most 2000 characters';
    }

    return next;
  };

  const handleSubmit = async () => {
    const errors = validate();
    setFieldErrors(errors);
    if (Object.values(errors).some((message) => message !== undefined)) return;

    setFormError(null);
    const address = values.shippingAddress;
    const payload: CreateOrderInput = {
      customer: selectedCustomer!.id,
      items: items.map((item) => ({
        product: item.productId,
        quantity: Number(item.quantity),
      })),
      paymentMethod: values.paymentMethod,
      source: values.source,
      shippingAddress: {
        recipientName: address.recipientName.trim() || undefined,
        phone: address.phone.trim() || undefined,
        addressLine: address.addressLine.trim(),
        area: address.area.trim() || undefined,
        district: address.district.trim(),
        city: address.city.trim() || undefined,
        postalCode: address.postalCode.trim() || undefined,
        country: address.country.trim() || undefined,
      },
      note: values.note.trim() || undefined,
    };
    if (effectiveRuleId) payload.selectedRuleId = effectiveRuleId;
    if (isManualPayment) {
      payload.transactionId = values.transactionId.trim();
      const senderPhone = values.senderPhone.trim();
      if (senderPhone) payload.senderPhone = senderPhone;
    }

    try {
      await onSubmit(payload);
    } catch (err) {
      if (isApiError(err) && err.errors) {
        const next: OrderFormErrors = {};
        let deliveryMessage: string | null = null;
        for (const [path, messages] of Object.entries(err.errors)) {
          const message = messages[0];
          if (!message) continue;

          const itemMatch = /^items\.(\d+)\./.exec(path);
          if (itemMatch && path.endsWith('.quantity')) {
            const item = items[Number(itemMatch[1])];
            if (item) next[item.key] = message;
            continue;
          }
          // The backend re-validates the delivery rule at creation; a rule
          // deactivated while the form was open surfaces here. The selection
          // is cleared and the list refetched so staff can pick a valid one.
          if (path === 'selectedRuleId') {
            deliveryMessage = message;
            continue;
          }
          const field = SERVER_FIELD_KEYS[path];
          if (field) next[field] = message;
        }
        if (deliveryMessage) {
          setDeliveryError(deliveryMessage);
          setSelectedRuleId(null);
          void deliveryRulesQuery.refetch();
        }
        if (
          deliveryMessage ||
          Object.values(next).some((value) => value !== undefined)
        ) {
          setFieldErrors(next);
          return;
        }
      }
      setFormError(getErrorMessage(err));
    }
  };

  return (
    <View style={styles.form}>
      <OrderCustomerPicker
        value={selectedCustomer}
        onChange={handleSelectCustomer}
        error={fieldErrors.customer}
        disabled={isSubmitting}
      />

      <SectionCard title="Items">
        <OrderItemsEditor
          items={items}
          itemsError={fieldErrors.items}
          itemErrors={fieldErrors}
          onItemsChange={handleItemsChange}
          deliveryRule={effectiveRule}
          disabled={isSubmitting}
        />
      </SectionCard>

      <View style={styles.controlsRow}>
        <View style={styles.control}>
          <Select
            label="Payment method"
            required
            value={values.paymentMethod}
            options={ORDER_PAYMENT_METHOD_OPTIONS}
            onChange={(value) => updateField('paymentMethod', value as PaymentMethod)}
            error={fieldErrors.paymentMethod}
            disabled={isSubmitting}
          />
        </View>
        <View style={styles.control}>
          <Select
            label="Source"
            required
            value={values.source}
            options={ORDER_SOURCE_OPTIONS}
            onChange={(value) => updateField('source', value as OrderSource)}
            error={fieldErrors.source}
            disabled={isSubmitting}
          />
        </View>
      </View>

      {isManualPayment ? (
        <>
          <Input
            label="Transaction ID"
            required
            value={values.transactionId}
            onChangeText={(text) => updateField('transactionId', text)}
            error={fieldErrors.transactionId}
            helperText="The transaction id from the customer's payment."
            editable={!isSubmitting}
            placeholder="e.g. 9H7XK2A4"
            maxLength={200}
          />
          <Input
            label="Sender phone"
            value={values.senderPhone}
            onChangeText={(text) => updateField('senderPhone', text)}
            error={fieldErrors.senderPhone}
            helperText="Optional. Format: 01XXXXXXXXX"
            editable={!isSubmitting}
            placeholder="Optional"
            keyboardType="phone-pad"
            maxLength={32}
          />
        </>
      ) : null}

      <SectionCard title="Shipping address">
        <Input
          label="Address line"
          required
          value={values.shippingAddress.addressLine}
          onChangeText={(text) => updateShippingField('addressLine', text)}
          error={fieldErrors.addressLine}
          editable={!isSubmitting}
          placeholder="Street address"
          maxLength={200}
        />
        <Input
          label="Recipient name"
          value={values.shippingAddress.recipientName}
          onChangeText={(text) => updateShippingField('recipientName', text)}
          error={fieldErrors.recipientName}
          editable={!isSubmitting}
          placeholder="Optional"
          maxLength={100}
        />
        <Input
          label="Phone"
          value={values.shippingAddress.phone}
          onChangeText={(text) => updateShippingField('phone', text)}
          error={fieldErrors.phone}
          editable={!isSubmitting}
          placeholder="Optional"
          keyboardType="phone-pad"
          maxLength={32}
        />
        <Input
          label="District"
          required
          value={values.shippingAddress.district}
          onChangeText={(text) => updateShippingField('district', text)}
          error={fieldErrors.district}
          helperText="Required for the delivery address."
          editable={!isSubmitting}
          placeholder="District"
          maxLength={100}
        />
        <Input
          label="Area / locality"
          value={values.shippingAddress.area}
          onChangeText={(text) => updateShippingField('area', text)}
          error={fieldErrors.area}
          editable={!isSubmitting}
          placeholder="Optional"
          maxLength={100}
        />
        <Input
          label="City"
          value={values.shippingAddress.city}
          onChangeText={(text) => updateShippingField('city', text)}
          error={fieldErrors.city}
          editable={!isSubmitting}
          placeholder="Optional"
          maxLength={100}
        />
        <Input
          label="Postal code"
          value={values.shippingAddress.postalCode}
          onChangeText={(text) => updateShippingField('postalCode', text)}
          error={fieldErrors.postalCode}
          editable={!isSubmitting}
          placeholder="Optional"
          maxLength={20}
        />
        <Input
          label="Country"
          value={values.shippingAddress.country}
          onChangeText={(text) => updateShippingField('country', text)}
          error={fieldErrors.country}
          editable={!isSubmitting}
          placeholder="Country"
          maxLength={100}
        />
      </SectionCard>

      <DeliveryOptionPicker
        rules={deliveryRules}
        isLoading={deliveryRulesQuery.isPending}
        loadFailed={deliveryRulesQuery.isError}
        selectedRuleId={effectiveRuleId}
        onSelect={handleSelectRule}
        error={deliveryError}
        disabled={isSubmitting}
      />

      <Input
        label="Note"
        value={values.note}
        onChangeText={(text) => updateField('note', text)}
        error={fieldErrors.note}
        helperText="Optional internal note (max 2000 characters)."
        editable={!isSubmitting}
        placeholder="Anything the team should know about this order"
        multiline
        numberOfLines={3}
        maxLength={2000}
      />

      {formError ? (
        <View
          style={[styles.formError, { borderColor: theme.colors.danger }]}
          accessibilityLiveRegion="polite"
        >
          <Text variant="bodySmall" tone="danger">
            {formError}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={onCancel}
          disabled={isSubmitting}
          style={styles.action}
        />
        <Button
          title="Create order"
          onPress={() => void handleSubmit()}
          loading={isSubmitting}
          style={styles.action}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  control: { flex: 1 },
  formError: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  action: { flex: 1 },
});
