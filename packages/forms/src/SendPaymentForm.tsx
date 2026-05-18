/**
 * Send Payment Form Component
 *
 * Headless unstyled form for sending XLM or USDC
 */
import { useState, useCallback } from 'react';
import { useSendPayment, useFreighter } from '@astronlabs/hooks';
import type { SendPaymentFormProps, SendPaymentValues, FormChildProps, FormErrors } from './types';

/**
 * Default values for payment form
 */
const DEFAULT_VALUES: SendPaymentValues = {
  to: '',
  amount: '',
  asset: 'XLM',
  memo: '',
};

/**
 * Validates payment form values
 * @param values - Form values
 * @returns Errors object
 */
function validatePayment(values: SendPaymentValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.to) {
    errors.to = 'Recipient address is required';
  } else if (!values.to.startsWith('G') || values.to.length !== 56) {
    errors.to = 'Invalid Stellar address';
  }

  if (!values.amount) {
    errors.amount = 'Amount is required';
  } else {
    const amount = parseFloat(values.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
  }

  if (!values.asset) {
    errors.asset = 'Asset is required';
  }

  return errors;
}

/**
 * Send Payment Form - Headless component for sending payments
 *
 * @example
 * ```tsx
 * <SendPaymentForm
 *   onSuccess={(tx) => console.log('Sent:', tx)}
 *   onError={(err) => console.error('Failed:', err)}
 * >
 *   {({ handleSubmit, loading, values, onChange, errors }) => (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         name="to"
 *         value={values.to}
 *         onChange={onChange}
 *         placeholder="Recipient address"
 *       />
 *       {errors.to && <span>{errors.to}</span>}
 *
 *       <input
 *         name="amount"
 *         value={values.amount}
 *         onChange={onChange}
 *         placeholder="Amount"
 *       />
 *       {errors.amount && <span>{errors.amount}</span>}
 *
 *       <select name="asset" value={values.asset} onChange={onChange}>
 *         <option value="XLM">XLM</option>
 *         <option value="USDC">USDC</option>
 *       </select>
 *
 *       <button type="submit" disabled={loading}>
 *         {loading ? 'Sending...' : 'Send'}
 *       </button>
 *     </form>
 *   )}
 * </SendPaymentForm>
 * ```
 */
export function SendPaymentForm({
  children,
  onSuccess,
  onError,
}: SendPaymentFormProps): JSX.Element {
  const { connected } = useFreighter();
  const { send, loading, error } = useSendPayment();

  const [values, setValues] = useState<SendPaymentValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Handle input changes
   */
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));
      // Clear error for this field
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

      // Validate
      const validationErrors = validatePayment(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Check wallet connection
      if (!connected) {
        setErrors({ submit: 'Please connect your wallet first' });
        return;
      }

      try {
        const txHash = await send({
          to: values.to,
          amount: values.amount,
          asset: values.asset,
          memo: values.memo,
        });
        onSuccess?.({ txHash });
        // Reset form
        setValues(DEFAULT_VALUES);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Payment failed');
        setErrors({ submit: error.message });
        onError?.(error);
      }
    },
    [values, connected, send, onSuccess, onError]
  );

  const childProps: FormChildProps<SendPaymentValues> = {
    handleSubmit,
    loading,
    values,
    onChange,
    errors: error ? { ...errors, submit: error.message } : errors,
    isValid: Object.keys(errors).length === 0 && connected,
  };

  return <>{children(childProps)}</>;
}
