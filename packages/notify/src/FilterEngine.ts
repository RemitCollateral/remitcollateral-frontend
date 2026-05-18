/**
 * Filter engine for matching decoded events to subscriber callbacks
 */
import type { DecodedEvent, EventFilter, Subscription } from './types';

/**
 * Filters and routes events to matching subscriptions
 */
export class FilterEngine {
  private subscriptions: Map<string, Subscription>;

  /**
   * Creates a new FilterEngine instance
   */
  constructor() {
    this.subscriptions = new Map();
  }

  /**
   * Adds a subscription to the filter engine
   * @param subscription - Subscription to add
   */
  addSubscription(subscription: Subscription): void {
    this.subscriptions.set(subscription.id, subscription);
  }

  /**
   * Removes a subscription by ID
   * @param subscriptionId - ID of subscription to remove
   * @returns True if subscription was removed
   */
  removeSubscription(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  /**
   * Gets all subscriptions matching a contract ID
   * @param contractId - Contract ID to filter by
   * @returns Array of matching subscriptions
   */
  getSubscriptionsForContract(contractId: string): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(
      (sub) => sub.filter.contractId === contractId
    );
  }

  /**
   * Gets all subscriptions for a specific event topic
   * @param contractId - Contract ID
   * @param topic - Event topic name
   * @returns Array of matching subscriptions
   */
  getSubscriptionsForTopic(contractId: string, topic: string): Subscription[] {
    return Array.from(this.subscriptions.values()).filter((sub) => {
      const matchesContract = sub.filter.contractId === contractId;
      const matchesTopic =
        !sub.filter.topic || sub.filter.topic === '*' || sub.filter.topic === topic;
      return matchesContract && matchesTopic;
    });
  }

  /**
   * Matches a decoded event against all subscriptions and returns matching callbacks
   * @param event - Decoded event to match
   * @returns Array of matching subscription callbacks
   */
  matchEvent(event: DecodedEvent): Array<{ subscriptionId: string; callback: (event: DecodedEvent) => void }> {
    const matches: Array<{ subscriptionId: string; callback: (event: DecodedEvent) => void }> = [];

    for (const subscription of this.subscriptions.values()) {
      if (this.matchesFilter(event, subscription.filter)) {
        matches.push({
          subscriptionId: subscription.id,
          callback: subscription.callback,
        });
      }
    }

    return matches;
  }

  /**
   * Checks if an event matches a filter
   * @param event - Decoded event
   * @param filter - Event filter to match against
   * @returns True if event matches filter
   */
  private matchesFilter(event: DecodedEvent, filter: EventFilter): boolean {
    // Match contract ID
    if (event.contractId !== filter.contractId) {
      return false;
    }

    // Match topic if specified
    if (filter.topic && filter.topic !== '*') {
      if (event.topic !== filter.topic) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets count of active subscriptions
   * @returns Number of subscriptions
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Clears all subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
  }
}
