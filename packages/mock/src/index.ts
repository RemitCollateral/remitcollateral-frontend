/**
 * @astronlabs/mock - Mock Soroban contracts and RPC for testing
 *
 * This package provides mock implementations of Soroban RPC,
 * smart contracts, and the Freighter wallet for testing
 * without requiring a live blockchain connection.
 *
 * @example
 * ```typescript
 * import { MockRpc, MockContract, MockFreighter, tokenFixture } from '@astronlabs/mock';
 *
 * const mockRpc = new MockRpc();
 * const token = new MockContract(mockRpc, tokenFixture);
 *
 * token.emit('transfer', { from: 'G...', to: 'G...', amount: 100 });
 *
 * const wallet = new MockFreighter({ publicKey: 'G...' });
 * await wallet.connect();
 * ```
 */

// Main classes
export { MockRpc } from './MockRpc';
export { MockContract } from './MockContract';
export { MockFreighter, NETWORK_PASSPHRASES } from './MockFreighter';

// Fixtures
export { tokenFixture, xlmFixture, usdcFixture } from './fixtures/token';
export {
  escrowFixture,
  multisigEscrowFixture,
  timelockedEscrowFixture,
} from './fixtures/escrow';

// Types
export type {
  MockFunction,
  MockEvent,
  ContractFixture,
  MockRpcResponse,
  SimulatedTransaction,
  MockEventData,
  FreighterState,
  FreighterOptions,
} from './types';

export type { CallResult } from './MockContract';
