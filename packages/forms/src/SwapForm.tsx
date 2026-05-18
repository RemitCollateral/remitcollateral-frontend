/**
 * Swap Form Component
 *
 * Headless unstyled form for token swaps
 */
import { useState, useCallback } from 'react';
import { useFreighter, useContractCall } from '@astronlabs/hooks';
import type { SwapFormProps, SwapValues, FormChildProps, FormErrors } from './types';

/**
 * Default values for swap form
 */
const DEFAULT_VALUES: SwapValues = {
  fromAsset: 'XLM',
  toAsset: 'USDC',
  fromAmount: '',
  toAmount: '',
  slippage: '0.5',
};

/**
 * Validates swap form values
 * @param values - Form values
 * @returns Errors object
 */
function validateSwap(values: SwapValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.fromAmount) {
    errors.fromAmount = 'From amount is required';
  } else {
    const amount = parseFloat(values.fromAmount);
    if (isNaN(amount) || amount <= 0) {
      errors.fromAmount = 'Amount must be greater than 0';
    }
  }

  if (!values.toAmount) {
    errors.toAmount = 'To amount is required';
  } else {
    const amount = parseFloat(values.toAmount);
    if (isNaN(amount) || amount <= 0) {
      errors.toAmount = 'Amount must be greater than 0';
    }
  }

  if (values.fromAsset === values.toAsset) {
    errors.toAsset = 'Cannot swap same asset';
  }

  const slippage = parseFloat(values.slippage);
  if (isNaN(slippage) || slippage < 0 || slippage > 100) {
    errors.slippage = 'Slippage must be between 0 and 100';
  }

  return errors;
}

/**
 * Swap Form - Headless component for token swaps
 *
 * @example
 * ```tsx
 * <SwapForm onSuccess={(result) => console.log('Swapped:', result)}>
 *   {({ handleSubmit, loading, values, onChange, errors }) => (
 *     <form onSubmit={handleSubmit}>
 *       <select name="fromAsset" value={values.fromAsset} onChange={onChange}>
 *         <option value="XLM">XLM</option>
 *         <option value="USDC">USDC</option>
 *       </select>
 *       <input name="fromAmount" value={values.fromAmount} onChange={onChange} />
 *
 *       <select name="toAsset" value={values.toAsset} onChange={onChange}>
 *         <option value="XLM">XLM</option>
 *         <option value="USDC">USDC</option>
 *       </select>
 *       <input name="toAmount" value={values.toAmount} onChange={onChange} />
 *
 *       <input name="slippage" value={values.slippage} onChange={onChange} />
 *
 *       <button type="submit" disabled={loading}>Swap</button>
 *     </form>
 *   )}
 * </SwapForm>
 * ```
 */
export function SwapForm({ children, onSuccess, onError }: SwapFormProps): JSX.Element {
  const { connected } = useFreighter();
  const { call, loading: callLoading, error: callError } = useContractCall();

  const [values, setValues] = useState<SwapValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});

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

      const validationErrors = validateSwap(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      if (!connected) {
        setErrors({ submit: 'Please connect your wallet first' });
        return;
      }

      try {
        // This would call a DEX or AMM contract
        // Placeholder implementation
        const result = await call({
          contractId: 'SWAP_CONTRACT_ID',
          function: 'swap',
          args: [
            values.fromAsset,
            values.toAsset,
            values.fromAmount,
            values.slippage,
          ],
        });
        onSuccess?.(result);
        setValues(DEFAULT_VALUES);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Swap failed');
        setErrors({ submit: error.message });
        onError?.(error);
      }
    },
    [values, connected, call, onSuccess, onError]
  );

  const childProps: FormChildProps<SwapValues> = {
    handleSubmit,
    loading: callLoading,
    values,
    onChange,
    errors: callError ? { ...errors, submit: callError.message } : errors,
    isValid: Object.keys(errors).length === 0 && connected,
  };

  return <>{children(childProps)}</>;
}
