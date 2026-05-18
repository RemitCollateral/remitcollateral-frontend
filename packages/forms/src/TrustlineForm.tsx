/**
 * Trustline Form Component
 *
 * Headless unstyled form for adding a trustline to an asset
 */
import { useState, useCallback } from 'react';
import { useFreighter } from '@astronlabs/hooks';
import type { TrustlineFormProps, TrustlineValues, FormChildProps, FormErrors } from './types';

/**
 * Default values for trustline form
 */
const DEFAULT_VALUES: TrustlineValues = {
  assetCode: '',
  issuer: '',
  limit: '',
};

/**
 * Validates trustline form values
 * @param values - Form values
 * @returns Errors object
 */
function validateTrustline(values: TrustlineValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.assetCode) {
    errors.assetCode = 'Asset code is required';
  } else if (values.assetCode.length < 1 || values.assetCode.length > 12) {
    errors.assetCode = 'Asset code must be 1-12 characters';
  }

  if (!values.issuer) {
    errors.issuer = 'Issuer address is required';
  } else if (!values.issuer.startsWith('G') || values.issuer.length !== 56) {
    errors.issuer = 'Invalid issuer address';
  }

  if (values.limit) {
    const limit = parseFloat(values.limit);
    if (isNaN(limit) || limit < 0) {
      errors.limit = 'Limit must be a positive number';
    }
  }

  return errors;
}

/**
 * Trustline Form - Headless component for adding asset trustlines
 *
 * @example
 * ```tsx
 * <TrustlineForm onSuccess={() => console.log('Trustline added')}>
 *   {({ handleSubmit, loading, values, onChange, errors }) => (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         name="assetCode"
 *         value={values.assetCode}
 *         onChange={onChange}
 *         placeholder="Asset code (e.g., USDC)"
 *       />
 *       {errors.assetCode && <span>{errors.assetCode}</span>}
 *
 *       <input
 *         name="issuer"
 *         value={values.issuer}
 *         onChange={onChange}
 *         placeholder="Issuer address"
 *       />
 *       {errors.issuer && <span>{errors.issuer}</span>}
 *
 *       <input
 *         name="limit"
 *         value={values.limit}
 *         onChange={onChange}
 *         placeholder="Limit (optional)"
 *       />
 *
 *       <button type="submit" disabled={loading}>Add Trustline</button>
 *     </form>
 *   )}
 * </TrustlineForm>
 * ```
 */
export function TrustlineForm({
  children,
  onSuccess,
  onError,
}: TrustlineFormProps): JSX.Element {
  const { connected } = useFreighter();

  const [values, setValues] = useState<TrustlineValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  /**
   * Handle input changes
   */
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }
    },
    [errors]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validationErrors = validateTrustline(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      if (!connected) {
        setErrors({ submit: 'Please connect your wallet first' });
        return;
      }

      setLoading(true);

      try {
        // In a real implementation, this would create and submit a
        // ChangeTrust operation to the Stellar network
        // Placeholder for now
        await new Promise((resolve) => setTimeout(resolve, 1000));

        onSuccess?.({
          assetCode: values.assetCode,
          issuer: values.issuer,
          limit: values.limit,
        });

        setValues(DEFAULT_VALUES);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to add trustline');
        setErrors({ submit: error.message });
        onError?.(error);
      } finally {
        setLoading(false);
      }
    },
    [values, connected, onSuccess, onError]
  );

  const childProps: FormChildProps<TrustlineValues> = {
    handleSubmit,
    loading,
    values,
    onChange,
    errors,
    isValid: Object.keys(errors).length === 0 && connected,
  };

  return <>{children(childProps)}</>;
}
