/**
 * @astronlabs/notify - Real-time Soroban contract event listener
 *
 * This package provides real-time event listening for Soroban smart contracts
 * on the Stellar blockchain. It polls the Soroban RPC getEvents endpoint,
 * decodes raw XDR events into plain JavaScript objects, and matches them
 * to subscriber callbacks.
 *
 * @example
 * ```typescript
 * import { StellarNotify } from '@astronlabs/notify';
 *
 * const notify = new StellarNotify({
 *   rpcUrl: 'https://soroban-testnet.stellar.org',
 *   network: 'testnet',
 *   pollInterval: 5000
 * });
 *
 * // Listen for transfer events
 * notify.onTransfer('C...', (event) => {
 *   console.log('Transfer:', event.data);
 * });
 *
 * // Cleanup when done
 * notify.destroy();
 * ```
 */

// Main class
export { StellarNotify } from './StellarNotify';

// Supporting classes
export { SubscriptionManager } from './SubscriptionManager';
export { EventPoller } from './EventPoller';
export { XdrDecoder } from './XdrDecoder';
export { FilterEngine } from './FilterEngine';
export { CursorState } from './CursorState';

// Utilities
export { withRetry } from './retry';

// Types
export type {
  Network,
  StellarNotifyConfig,
  DecodedEvent,
  RawEvent,
  EventFilter,
  EventCallback,
  Subscription,
  CursorState as CursorStateType,
  RpcError,
  GetEventsResponse,
} from './types';

export type { RetryConfig } from './retry';
export type { EventHandler } from './EventPoller';
