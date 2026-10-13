import { useState } from 'react';
import { View } from 'react-native';

import { getErrorMessage, isApiError } from '@/api';
import { Dialog, Input, Text } from '@/components/ui';

import type { CreateExpenseCategoryInput, ExpenseCategory } from '../types';

interface ExpenseCategoryDialogProps {
  /** `null` = create; otherwise the category being edited. */
  category: ExpenseCategory | null;
  isSubmitting: boolean;
  onSubmit: (input: CreateExpenseCategoryInput) => Promise<void>;
  onClose: () => void;
}

/**
 * Create/edit dialog for an expense category (`POST`/`PATCH
 * /expense-categories`). Mount this only while it is open (the manager screen
 * keys it by the edited id) so the fields always start from the right values
 * without an effect. Server field errors map back onto the inputs; anything
 * else surfaces as a dialog-level message. Categories always live in the
 * backend - this is the shape's only client-side validation.
 */
export function ExpenseCategoryDialog({
  category,
  isSubmitting,
  onSubmit,
  onClose,
}: ExpenseCategoryDialogProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Name is required');
      return;
    }
    if (trimmedName.length > 100) {
      setNameError('Name must be at most 100 characters');
      return;
    }
    setNameError(null);
    setFormError(null);

    try {
      await onSubmit({
        name: trimmedName,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      if (isApiError(err) && err.errors?.name?.[0]) {
        setNameError(err.errors.name[0]);
        return;
      }
      setFormError(getErrorMessage(err));
    }
  };

  return (
    <Dialog
      visible
      onClose={onClose}
      title={category ? 'Edit category' : 'New expense category'}
      primaryAction={{
        label: category ? 'Save changes' : 'Create category',
        loading: isSubmitting,
        onPress: () => void handleSubmit(),
      }}
      secondaryAction={{ label: 'Cancel', onPress: onClose }}
      dismissOnBackdrop={!isSubmitting}
    >
      <View style={{ gap: 12 }}>
        <Input
          label="Name"
          required
          value={name}
          onChangeText={setName}
          error={nameError}
          editable={!isSubmitting}
          placeholder="e.g. Office supplies"
          maxLength={100}
          autoFocus
        />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          editable={!isSubmitting}
          placeholder="Optional description"
          multiline
          numberOfLines={3}
          maxLength={1000}
        />
        {formError ? (
          <Text variant="bodySmall" tone="danger" accessibilityLiveRegion="polite">
            {formError}
          </Text>
        ) : null}
      </View>
    </Dialog>
  );
}
