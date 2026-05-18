/**
 * Type definitions for @astronlabs/forms
 */
import type { ReactNode } from 'react';

/** Generic form values */
export type FormValues = Record<string, string>;

/** Form errors by field */
export type FormErrors = Record<string, string>;

/** Base form child props (render prop pattern) */
export interface FormChildProps<T extends FormValues> {
  /** Submit handler */
  handleSubmit: (e: React.FormEvent) => void;
  /** Whether form is submitting */
  loading: boolean;
  /** Current form values */
  values: T;
  /** Change handler */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  /** Form errors */
  errors: FormErrors;
  /** Whether form is valid */
  isValid: boolean;
}

/** Base form props */
export interface BaseFormProps<T extends FormValues> {
  /** Render prop for form UI */
  children: (props: FormChildProps<T>) => ReactNode;
  /** Success callback */
  onSuccess?: (result: unknown) => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

/** Send payment form values */
export interface SendPaymentValues extends FormValues {
  to: string;
  amount: string;
  asset: string;
  memo?: string;
}

/** Send payment form props */
export type SendPaymentFormProps = BaseFormProps<SendPaymentValues>;

/** Swap form values */
export interface SwapValues extends FormValues {
  fromAsset: string;
  toAsset: string;
  fromAmount: string;
  toAmount: string;
  slippage: string;
}

/** Swap form props */
export type SwapFormProps = BaseFormProps<SwapValues>;

/** Trustline form values */
export interface TrustlineValues extends FormValues {
  assetCode: string;
  issuer: string;
  limit?: string;
}

/** Trustline form props */
export type TrustlineFormProps = BaseFormProps<TrustlineValues>;

/** Connect wallet button props */
export interface ConnectWalletButtonProps {
  /** Render prop for button UI */
  children: (props: {
    onClick: () => void;
    loading: boolean;
    connected: boolean;
    publicKey: string | null;
  }) => ReactNode;
}
