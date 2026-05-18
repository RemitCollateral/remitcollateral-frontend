/**
 * Type definitions for @astronlabs/hooks
 */
import type { ReactNode } from 'react';
import type { Network } from '@astronlabs/notify';

/** Stellar configuration */
export interface StellarConfig {
  /** RPC URL */
  rpcUrl: string;
  /** Network type */
  network: Network;
  /** Network passphrase */
  networkPassphrase?: string;
  /** Optional horizon URL for legacy operations */
  horizonUrl?: string;
}

/** Stellar context value */
export interface StellarContextValue {
  /** Stellar configuration */
  config: StellarConfig;
  /** Whether connection is loading */
  isLoading: boolean;
  /** Connection error if any */
  error: Error | null;
}

/** Provider props */
export interface StellarProviderProps {
  /** RPC URL */
  rpcUrl: string;
  /** Network type */
  network: Network;
  /** Children elements */
  children: ReactNode;
}

/** Balance result */
export interface BalanceResult {
  /** Balance amount (in stroops for XLM) */
  balance: bigint;
  /** Whether loading */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Refetch function */
  refetch: () => void;
}

/** Payment send result */
export interface SendPaymentResult {
  /** Send function */
  send: (params: PaymentParams) => Promise<string>;
  /** Whether sending */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Transaction hash if successful */
  txHash: string | null;
}

/** Payment parameters */
export interface PaymentParams {
  /** Destination public key */
  to: string;
  /** Amount to send */
  amount: string;
  /** Asset code (XLM for native, or token contract ID) */
  asset?: string;
  /** Optional memo */
  memo?: string;
}

/** Transaction status */
export type TransactionStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'not_found'
  | 'unknown';

/** Transaction result */
export interface TransactionResult {
  /** Transaction status */
  status: TransactionStatus;
  /** Transaction data */
  transaction: unknown | null;
  /** Whether loading */
  loading: boolean;
  /** Error if any */
  error: Error | null;
}

/** Contract call result */
export interface ContractCallResult {
  /** Call function */
  call: (params: ContractCallParams) => Promise<unknown>;
  /** Result data */
  result: unknown;
  /** Whether calling */
  loading: boolean;
  /** Error if any */
  error: Error | null;
}

/** Contract call parameters */
export interface ContractCallParams {
  /** Contract ID */
  contractId: string;
  /** Function name */
  function: string;
  /** Function arguments */
  args?: unknown[];
}

/** Stellar event hook result */
export interface StellarEventResult {
  /** Latest event */
  event: unknown | null;
  /** Whether listening */
  isListening: boolean;
  /** Error if any */
  error: Error | null;
}

/** Freighter wallet state */
export interface FreighterState {
  /** Whether connected */
  connected: boolean;
  /** Public key */
  publicKey: string | null;
  /** Whether loading */
  loading: boolean;
  /** Error if any */
  error: Error | null;
}

/** Freighter hook result */
export interface UseFreighterResult extends FreighterState {
  /** Connect wallet */
  connect: () => Promise<void>;
  /** Disconnect wallet */
  disconnect: () => void;
  /** Sign transaction */
  signTransaction: (txXdr: string) => Promise<string>;
}
