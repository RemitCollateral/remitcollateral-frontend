/**
 * Mock RPC server for Soroban testing
 */
import type {
  MockRpcResponse,
  SimulatedTransaction,
  MockEventData,
} from './types';

/**
 * Mock Soroban RPC server for testing
 *
 * @example
 * ```typescript
 * const mockRpc = new MockRpc();
 * mockRpc.simulateTransaction({
 *   txXdr: '...',
 *   result: { success: true }
 * });
 * ```
 */
export class MockRpc {
  private latestLedger: number;
  private transactions: Map<string, SimulatedTransaction>;
  private events: MockEventData[];
  private methods: Map<string, (params: unknown[]) => unknown>;

  /**
   * Creates a new MockRpc instance
   * @param initialLedger - Starting ledger sequence (default: 1)
   */
  constructor(initialLedger: number = 1) {
    this.latestLedger = initialLedger;
    this.transactions = new Map();
    this.events = [];
    this.methods = new Map();

    this.registerDefaultMethods();
  }

  /**
   * Simulates a transaction
   * @param simulation - Transaction simulation data
   */
  simulateTransaction(simulation: SimulatedTransaction): void {
    this.transactions.set(simulation.txHash, simulation);
  }

  /**
   * Adds an event to the mock
   * @param event - Event data
   */
  addEvent(event: MockEventData): void {
    this.events.push({
      ...event,
      ledgerSequence: event.ledgerSequence ?? this.latestLedger,
    });
  }

  /**
   * Advances the ledger sequence
   * @param count - Number of ledgers to advance (default: 1)
   */
  advanceLedger(count: number = 1): void {
    this.latestLedger += count;
  }

  /**
   * Gets the current ledger sequence
   * @returns Latest ledger sequence
   */
  getLatestLedger(): number {
    return this.latestLedger;
  }

  /**
   * Sets the latest ledger sequence
   * @param ledger - Ledger sequence number
   */
  setLatestLedger(ledger: number): void {
    this.latestLedger = ledger;
  }

  /**
   * Registers a custom RPC method handler
   * @param method - Method name
   * @param handler - Handler function
   */
  registerMethod(method: string, handler: (params: unknown[]) => unknown): void {
    this.methods.set(method, handler);
  }

  /**
   * Calls an RPC method
   * @param method - Method name
   * @param params - Method parameters
   * @returns RPC response
   */
  call<T>(method: string, params: unknown[] = []): MockRpcResponse<T> {
    try {
      const handler = this.methods.get(method);
      if (!handler) {
        return {
          jsonrpc: '2.0',
          result: null as T,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
        };
      }

      const result = handler(params);
      return {
        jsonrpc: '2.0',
        result: result as T,
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        result: null as T,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Gets events matching criteria
   * @param filter - Event filter criteria
   * @returns Matching events
   */
  getEvents(filter?: {
    contractId?: string;
    name?: string;
    startLedger?: number;
  }): MockEventData[] {
    return this.events.filter((event) => {
      if (filter?.contractId && event.contractId !== filter.contractId) {
        return false;
      }
      if (filter?.name && event.name !== filter.name) {
        return false;
      }
      if (filter?.startLedger && event.ledgerSequence < filter.startLedger) {
        return false;
      }
      return true;
    });
  }

  /**
   * Clears all stored data
   */
  clear(): void {
    this.transactions.clear();
    this.events = [];
    this.latestLedger = 1;
  }

  /**
   * Resets to initial state
   */
  reset(): void {
    this.clear();
    this.methods.clear();
    this.registerDefaultMethods();
  }

  /**
   * Registers default RPC method handlers
   */
  private registerDefaultMethods(): void {
    this.methods.set('getLatestLedger', () => ({
      sequence: this.latestLedger,
    }));

    this.methods.set('getHealth', () => ({
      status: 'healthy',
    }));

    this.methods.set('getTransaction', (params) => {
      const txHash = params[0] as string;
      return this.transactions.get(txHash) ?? null;
    });

    this.methods.set('sendTransaction', (params) => {
      const txXdr = params[0] as string;
      const txHash = this.hashXdr(txXdr);
      const simulation: SimulatedTransaction = {
        txHash,
        txXdr,
        result: null,
        success: true,
      };
      this.transactions.set(txHash, simulation);
      return { hash: txHash };
    });

    this.methods.set('simulateTransaction', (params) => {
      const txXdr = params[0] as string;
      return {
        transactionData: { xdr: txXdr },
        minResourceFee: '0',
        results: [],
      };
    });

    this.methods.set('getEvents', (params) => {
      const filter = params[0] as { contractIds?: string[]; topics?: string[][] } | undefined;
      let events = this.events;

      if (filter?.contractIds) {
        events = events.filter((e) => filter.contractIds?.includes(e.contractId));
      }

      return {
        events,
        latestLedger: this.latestLedger,
      };
    });
  }

  /**
   * Creates a simple hash from XDR (for mock purposes)
   * @param xdr - XDR string
   * @returns Mock transaction hash
   */
  private hashXdr(xdr: string): string {
    // Simple mock hash - in production use proper hashing
    return `tx_${Buffer.from(xdr).toString('base64').slice(0, 16)}_${Date.now()}`;
  }
}
