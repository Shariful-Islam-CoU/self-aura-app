/**
 * Minimal client-side validation helpers shared by feature forms.
 *
 * Form strategy (see README "Architecture & Development Rules"):
 * - Backend validation stays authoritative: these checks only give instant UX
 *   feedback and never replace a server response - `ApiError.errors` from a
 *   failed submit always overrides whatever the client predicted.
 * - Validators return the error message, or `undefined` when valid, and skip
 *   empty input (only `required` rejects emptiness), so they compose in any
 *   order. Mirrors the per-form `validate()` functions on the web client
 *   (SupplierForm, CustomerForm, UserFormDialog) without a form library.
 */

export type Validator = (value: string) => string | undefined;

/** Same email shape the web forms test with. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Rejects empty/whitespace-only input: `"Name is required"`. */
export function required(label: string): Validator {
  return (value) => (value.trim() ? undefined : `${label} is required`);
}

/** Minimum length of trimmed input when non-empty (e.g. username >= 3). */
export function minLength(label: string, min: number): Validator {
  return (value) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length >= min) return undefined;
    return `${label} must be at least ${min} characters`;
  };
}

/** Maximum length of trimmed input when non-empty (backend zod mirrors). */
export function maxLength(label: string, max: number): Validator {
  return (value) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length <= max) return undefined;
    return `${label} must be at most ${max} characters`;
  };
}

/** Email format for non-empty input; empty is left to `required`. */
export function email(label = 'Email'): Validator {
  return (value) => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return EMAIL_PATTERN.test(trimmed) ? undefined : `${label} must be a valid email address`;
  };
}

/**
 * Compares against another value captured at call time (raw, untrimmed -
 * passwords are never trimmed), for confirm-password checks.
 */
export function matches(otherValue: string, message = 'Passwords do not match'): Validator {
  return (value) => (value === otherValue ? undefined : message);
}

/** Runs the validators in order and returns the first failure, if any. */
export function validateField(value: string, validators: Validator[]): string | undefined {
  for (const validator of validators) {
    const error = validator(value);
    if (error) return error;
  }
  return undefined;
}
