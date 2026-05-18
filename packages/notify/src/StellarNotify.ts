/**
 * StellarNotify - Real-time Soroban contract event listener
 *
 * @example
 * ```typescript
 * const notify = new StellarNotify({
 *   rpcUrl: 'https://soroban-testnet.stellar.org',
 *   network: 'testnet',
 *   pollInterval: 5000
 * });
 *
 * notify.onEvent('C...', 'transfer', (event) => {
 *   console.log('Transfer:', event);
 * });
 *
 * notify.destroy();
 * ```
 */
import { SubscriptionManager } from './SubscriptionManager';
import { EventPoller } from './EventPoller';
import type {
  StellarNotifyConfig,
  EventCallback,
  DecodedEvent,
} from './types';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  pollInterval: 5000,
  maxRetries: 5,
  retryDelayMs: 1000,
};

/**
 * Real-time Soroban contract event listener
 */
export class StellarNotify {
  private config: Required<StellarNotifyConfig>;
  private subscriptionManager: SubscriptionManager;
  private eventPoller: EventPoller | null;

  /**
   * Creates a new StellarNotify instance
   * @param config - Configuration options
   */
  constructor(config: StellarNotifyConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
    this.subscriptionManager = new SubscriptionManager();
    this.eventPoller = null;
  }

  /**
   * Subscribes to events from a contract with a specific topic
   * @param contractId - Contract ID (C...)
   * @param topic - Event topic name (e.g., 'transfer', 'mint')
   * @param callback - Callback function for matching events
   * @returns Unsubscribe function
   */
  onEvent(contractId: string, topic: string, callback: EventCallback): () => void {
    const subscriptionId = this.subscriptionManager.subscribe(
      { contractId, topic },
      callback
    );

    this.ensurePolling();

    return () => {
      this.subscriptionManager.unsubscribe(subscriptionId);
      this.checkStopPolling();
    };
  }

  /**
   * Subscribes to transfer events from a contract
   * Convenience method for the common 'transfer' topic
   * @param contractId - Contract ID (C...)
   * @param callback - Callback function for transfer events
   * @returns Unsubscribe function
   */
  onTransfer(contractId: string, callback: EventCallback): () => void {
    return this.onEvent(contractId, 'transfer', callback);
  }

  /**
   * Subscribes to mint events from a contract
   * Convenience method for the common 'mint' topic
   * @param contractId - Contract ID (C...)
   * @param callback - Callback function for mint events
   * @returns Unsubscribe function
   */
  onMint(contractId: string, callback: EventCallback): () => void {
    return this.onEvent(contractId, 'mint', callback);
  }

  /**
   * Subscribes to burn events from a contract
   * Convenience method for the common 'burn' topic
   * @param contractId - Contract ID (C...)
   * @param callback - Callback function for burn events
   * @returns Unsubscribe function
   */
  onBurn(contractId: string, callback: EventCallback): () => void {
    return this.onEvent(contractId, 'burn', callback);
  }

  /**
   * Subscribes to all events from a contract (any topic)
   * @param contractId - Contract ID (C...)
   * @param callback - Callback function for all events
   * @returns Unsubscribe function
   */
  onAnyEvent(contractId: string, callback: EventCallback): () => void {
    const subscriptionId = this.subscriptionManager.subscribe(
      { contractId, topic: '*' },
      callback
    );

    this.ensurePolling();

    return () => {
      this.subscriptionManager.unsubscribe(subscriptionId);
      this.checkStopPolling();
    };
  }

  /**
   * Unsubscribes all listeners for a specific contract and topic
   * @param contractId - Contract ID
   * @param topic - Event topic (optional, if omitted unsubscribes all topics)
   */
  off(contractId: string, topic?: string): void {
    if (topic) {
      this.subscriptionManager.unsubscribeByTopic(contractId, topic);
    } else {
      this.subscriptionManager.unsubscribeAll(contractId);
    }
    this.checkStopPolling();
  }

  /**
   * Gets the number of active subscriptions
   * @returns Subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptionManager.getSubscriptionCount();
  }

  /**
   * Destroys the StellarNotify instance and cleans up resources
   */
  destroy(): void {
    if (this.eventPoller) {
      this.eventPoller.stop();
      this.eventPoller = null;
    }
    this.subscriptionManager.clear();
  }

  /**
   * Ensures the event poller is running
   */
  private ensurePolling(): void {
    if (!this.eventPoller) {
      this.eventPoller = new EventPoller(this.config, (events) => {
        this.handleEvents(events);
      });
    }
    this.eventPoller.start();
  }

  /**
   * Stops polling if no active subscriptions
   */
  private checkStopPolling(): void {
    if (!this.subscriptionManager.hasSubscriptions() && this.eventPoller) {
      this.eventPoller.stop();
    }
  }

  /**
   * Handles incoming events from the poller
   * @param events - Decoded events
   */
  private handleEvents(events: DecodedEvent[]): void {
    const engine = this.subscriptionManager.getFilterEngine();

    for (const event of events) {
      const matches = engine.matchEvent(event);
      for (const match of matches) {
        try {
          match.callback(event);
        } catch (error) {
          // Log but don't stop processing other callbacks
          console.error('Error in event callback:', error);
        }
      }
    }
  }
}
