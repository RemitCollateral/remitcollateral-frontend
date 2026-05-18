/**
 * Subscription manager for tracking all active listeners
 */
import { randomUUID } from 'crypto';
import { FilterEngine } from './FilterEngine';
import type { EventFilter, EventCallback, Subscription } from './types';

/**
 * Manages event subscriptions with deduplication support
 */
export class SubscriptionManager {
  private filterEngine: FilterEngine;

  /**
   * Creates a new SubscriptionManager instance
   */
  constructor() {
    this.filterEngine = new FilterEngine();
  }

  /**
   * Subscribes to events matching a filter
   * @param filter - Event filter criteria
   * @param callback - Callback function for matching events
   * @returns Subscription ID
   */
  subscribe(filter: EventFilter, callback: EventCallback): string {
    const id = this.generateSubscriptionId(filter);
    const subscription: Subscription = {
      id,
      filter,
      callback,
    };

    this.filterEngine.addSubscription(subscription);
    return id;
  }

  /**
   * Unsubscribes from events by subscription ID
   * @param subscriptionId - ID of subscription to remove
   * @returns True if subscription was removed
   */
  unsubscribe(subscriptionId: string): boolean {
    return this.filterEngine.removeSubscription(subscriptionId);
  }

  /**
   * Unsubscribes all listeners for a contract
   * @param contractId - Contract ID
   * @returns Number of subscriptions removed
   */
  unsubscribeAll(contractId: string): number {
    const subs = this.filterEngine.getSubscriptionsForContract(contractId);
    let count = 0;
    for (const sub of subs) {
      if (this.filterEngine.removeSubscription(sub.id)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Unsubscribes listeners for a specific contract and topic
   * @param contractId - Contract ID
   * @param topic - Event topic
   * @returns Number of subscriptions removed
   */
  unsubscribeByTopic(contractId: string, topic: string): number {
    const subs = this.filterEngine.getSubscriptionsForTopic(contractId, topic);
    let count = 0;
    for (const sub of subs) {
      if (sub.filter.topic === topic && this.filterEngine.removeSubscription(sub.id)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Gets all subscriptions for a contract
   * @param contractId - Contract ID
   * @returns Array of subscriptions
   */
  getSubscriptions(contractId: string): Subscription[] {
    return this.filterEngine.getSubscriptionsForContract(contractId);
  }

  /**
   * Checks if there are any active subscriptions
   * @returns True if there are active subscriptions
   */
  hasSubscriptions(): boolean {
    return this.filterEngine.getSubscriptionCount() > 0;
  }

  /**
   * Gets the total number of subscriptions
   * @returns Subscription count
   */
  getSubscriptionCount(): number {
    return this.filterEngine.getSubscriptionCount();
  }

  /**
   * Clears all subscriptions
   */
  clear(): void {
    this.filterEngine.clear();
  }

  /**
   * Gets the underlying filter engine
   * @returns FilterEngine instance
   */
  getFilterEngine(): FilterEngine {
    return this.filterEngine;
  }

  /**
   * Generates a unique subscription ID
   * @param filter - Event filter
   * @returns Unique subscription ID
   */
  private generateSubscriptionId(filter: EventFilter): string {
    const base = `${filter.contractId}-${filter.topic ?? '*'}-${Date.now()}`;
    return `${base}-${randomUUID().slice(0, 8)}`;
  }
}
