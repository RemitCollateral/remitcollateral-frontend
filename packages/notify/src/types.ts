/**
 * Type definitions for @astronlabs/notify
 */

/** Supported Stellar networks */
export type Network = 'testnet' | 'mainnet' | 'futurenet';

/** Configuration options for StellarNotify */
export interface StellarNotifyConfig {
  /** Soroban RPC URL */
  rpcUrl: string;
  /** Stellar network */
  network: Network;
  /** Poll interval in milliseconds (default: 5000) */
  pollInterval?: number;
  /** Maximum retry attempts for RPC failures (default: 5) */
  maxRetries?: number;
  /** Initial retry delay in milliseconds (default: 1000) */
  retryDelayMs?: number;
}

/** Decoded Soroban event */
export interface DecodedEvent {
  /** Contract ID (contract address) */
  contractId: string;
  /** Event topic name */
  topic: string;
  /** Event payload data */
  data: Record<string, unknown>;
  /** Ledger sequence number */
  ledgerSequence: number;
  /** Transaction hash */
  txHash: string;
  /** Event timestamp */
  timestamp?: Date;
}

/** Raw event from RPC */
export interface RawEvent {
  type: 'contract';
  contractId: string;
  topics: string[];
  value: string;
  ledgerSequence: number;
  txHash: string;
}

/** Event filter for subscriptions */
export interface EventFilter {
  /** Contract ID to filter by */
  contractId: string;
  /** Event topic to filter by */
  topic?: string;
}

/** Callback function for event handlers */
export type EventCallback = (event: DecodedEvent) => void;

/** Subscription entry */
export interface Subscription {
  id: string;
  filter: EventFilter;
  callback: EventCallback;
}

/** Cursor state for event pagination */
export interface CursorState {
  lastLedgerSequence: number;
  cursor?: string;
}

/** RPC error response */
export interface RpcError {
  code: number;
  message: string;
  data?: unknown;
}

/** GetEvents RPC response */
export interface GetEventsResponse {
  events: RawEvent[];
  latestLedger: number;
  cursor?: string;
}
