/**
 * Mock Soroban contract for testing
 */
import { MockRpc } from './MockRpc';
import type {
  ContractFixture,
  MockFunction,
  MockEvent,
  MockEventData,
} from './types';

/**
 * Mock contract function call result
 */
export interface CallResult {
  /** Success status */
  success: boolean;
  /** Return value */
  value: unknown;
  /** Error message if failed */
  error?: string;
}

/**
 * Mock contract instance for testing
 *
 * @example
 * ```typescript
 * const mockRpc = new MockRpc();
 * const token = new MockContract(mockRpc, tokenFixture);
 *
 * const result = token.call('balance_of', { account: 'G...' });
 * token.emit('transfer', { from: 'G...', to: 'G...', amount: 100 });
 * ```
 */
export class MockContract {
  private rpc: MockRpc;
  private fixture: ContractFixture;
  private storage: Map<string, unknown>;
  private eventHandlers: Map<string, Array<(data: Record<string, unknown>) => void>>;

  /**
   * Creates a new MockContract instance
   * @param rpc - MockRpc instance
   * @param fixture - Contract fixture definition
   */
  constructor(rpc: MockRpc, fixture: ContractFixture) {
    this.rpc = rpc;
    this.fixture = fixture;
    this.storage = new Map(Object.entries(fixture.initialStorage ?? {}));
    this.eventHandlers = new Map();

    this.registerWithRpc();
  }

  /**
   * Gets the contract ID
   * @returns Contract ID
   */
  getContractId(): string {
    return this.fixture.contractId;
  }

  /**
   * Calls a contract function
   * @param functionName - Name of function to call
   * @param args - Function arguments
   * @returns Call result
   */
  call(functionName: string, args: Record<string, unknown> = {}): CallResult {
    const func = this.fixture.functions.find((f) => f.name === functionName);
    if (!func) {
      return {
        success: false,
        value: null,
        error: `Function not found: ${functionName}`,
      };
    }

    // Store call in storage if it modifies state
    if (functionName.startsWith('set_') || functionName === 'transfer' || functionName === 'mint' || functionName === 'burn') {
      const key = `${functionName}_${JSON.stringify(args)}`;
      this.storage.set(key, args);
    }

    // Generate mock result based on function
    const result = this.generateMockResult(functionName, args, func);

    // Emit any related events
    if (functionName === 'transfer') {
      this.emit('transfer', {
        from: args.from,
        to: args.to,
        amount: args.amount,
      });
    } else if (functionName === 'mint') {
      this.emit('mint', {
        to: args.to,
        amount: args.amount,
      });
    } else if (functionName === 'burn') {
      this.emit('burn', {
        from: args.from,
        amount: args.amount,
      });
    }

    return {
      success: true,
      value: result,
    };
  }

  /**
   * Emits a contract event
   * @param eventName - Event name
   * @param data - Event data
   */
  emit(eventName: string, data: Record<string, unknown>): void {
    const event: MockEventData = {
      contractId: this.fixture.contractId,
      name: eventName,
      data,
      ledgerSequence: this.rpc.getLatestLedger(),
    };

    // Add to RPC events
    this.rpc.addEvent(event);

    // Call local handlers
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  /**
   * Subscribes to contract events
   * @param eventName - Event name to listen for
   * @param handler - Event handler callback
   * @returns Unsubscribe function
   */
  on(eventName: string, handler: (data: Record<string, unknown>) => void): () => void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)!.push(handler);

    return () => {
      const handlers = this.eventHandlers.get(eventName);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Gets storage value
   * @param key - Storage key
   * @returns Stored value
   */
  getStorage(key: string): unknown {
    return this.storage.get(key);
  }

  /**
   * Sets storage value
   * @param key - Storage key
   * @param value - Value to store
   */
  setStorage(key: string, value: unknown): void {
    this.storage.set(key, value);
  }

  /**
   * Gets all storage entries
   * @returns Storage map
   */
  getAllStorage(): Record<string, unknown> {
    return Object.fromEntries(this.storage);
  }

  /**
   * Gets available functions
   * @returns Array of function definitions
   */
  getFunctions(): MockFunction[] {
    return [...this.fixture.functions];
  }

  /**
   * Gets available events
   * @returns Array of event definitions
   */
  getEvents(): MockEvent[] {
    return [...this.fixture.events];
  }

  /**
   * Clears all storage and handlers
   */
  clear(): void {
    this.storage.clear();
    this.eventHandlers.clear();
  }

  /**
   * Registers contract methods with the mock RPC
   */
  private registerWithRpc(): void {
    // Register contract-specific RPC methods
    const contractId = this.fixture.contractId;

    this.rpc.registerMethod(`getContractData_${contractId}`, (params) => {
      const key = params[0] as string;
      return this.getStorage(key);
    });

    this.rpc.registerMethod(`invokeContract_${contractId}`, (params) => {
      const functionName = params[0] as string;
      const args = params[1] as Record<string, unknown>;
      return this.call(functionName, args);
    });
  }

  /**
   * Generates a mock result for a function call
   * @param functionName - Function name
   * @param args - Function arguments
   * @param func - Function definition
   * @returns Mock result value
   */
  private generateMockResult(
    functionName: string,
    args: Record<string, unknown>,
    func: MockFunction
  ): unknown {
    switch (functionName) {
      case 'balance_of':
        return 1000n;
      case 'total_supply':
        return 1000000n;
      case 'decimals':
        return 7;
      case 'name':
        return 'Mock Token';
      case 'symbol':
        return 'MOCK';
      case 'get_balance':
        return args.account ? 1000n : 0n;
      case 'allowance':
        return 500n;
      case 'is_approved':
        return true;
      case 'get_state':
        return this.getStorage('state') ?? 'active';
      default:
        // Return a sensible default based on return type
        if (func.returns?.includes('u64') || func.returns?.includes('i64')) {
          return 0n;
        }
        if (func.returns?.includes('bool')) {
          return false;
        }
        if (func.returns?.includes('string')) {
          return '';
        }
        return null;
    }
  }
}
