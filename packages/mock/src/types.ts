/**
 * Type definitions for @astronlabs/mock
 */

/** Mock contract function definition */
export interface MockFunction {
  /** Function name */
  name: string;
  /** Function arguments */
  args: string[];
  /** Return type */
  returns?: string;
}

/** Mock contract event definition */
export interface MockEvent {
  /** Event name */
  name: string;
  /** Event field names */
  fields: string[];
}

/** Mock contract fixture definition */
export interface ContractFixture {
  /** Contract ID */
  contractId: string;
  /** Contract functions */
  functions: MockFunction[];
  /** Contract events */
  events: MockEvent[];
  /** Initial storage state */
  initialStorage?: Record<string, unknown>;
}

/** Mock RPC response */
export interface MockRpcResponse<T = unknown> {
  /** Response JSON-RPC ID */
  jsonrpc: string;
  /** Result data */
  result: T;
  /** Error if any */
  error?: {
    code: number;
    message: string;
  };
}

/** Simulated transaction */
export interface SimulatedTransaction {
  /** Transaction hash */
  txHash: string;
  /** Transaction XDR */
  txXdr: string;
  /** Simulated result */
  result: unknown;
  /** Success flag */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/** Mock event data */
export interface MockEventData {
  /** Contract ID */
  contractId: string;
  /** Event name */
  name: string;
  /** Event payload */
  data: Record<string, unknown>;
  /** Ledger sequence */
  ledgerSequence: number;
}

/** Freighter wallet state */
export interface FreighterState {
  /** Connected status */
  connected: boolean;
  /** Public key */
  publicKey: string | null;
  /** Network passphrase */
  network: string;
}

/** Freighter connection options */
export interface FreighterOptions {
  /** Public key to return */
  publicKey: string;
  /** Network passphrase */
  network?: string;
}
