import { describe, it, expect, vi } from 'vitest';
import { FilterEngine } from './FilterEngine';
import type { DecodedEvent, Subscription } from './types';

describe('FilterEngine', () => {
  const engine = new FilterEngine();

  const mockEvent: DecodedEvent = {
    contractId: 'C123',
    topic: 'transfer',
    data: { amount: 100 },
    ledgerSequence: 100,
    txHash: 'abc123',
  };

  const mockCallback = vi.fn();

  beforeEach(() => {
    engine.clear();
    mockCallback.mockClear();
  });

  it('should add and retrieve subscriptions', () => {
    const sub: Subscription = {
      id: 'sub-1',
      filter: { contractId: 'C123', topic: 'transfer' },
      callback: mockCallback,
    };

    engine.addSubscription(sub);

    expect(engine.getSubscriptionCount()).toBe(1);
  });

  it('should remove subscriptions', () => {
    const sub: Subscription = {
      id: 'sub-1',
      filter: { contractId: 'C123' },
      callback: mockCallback,
    };

    engine.addSubscription(sub);
    const removed = engine.removeSubscription('sub-1');

    expect(removed).toBe(true);
    expect(engine.getSubscriptionCount()).toBe(0);
  });

  it('should match events by contract ID', () => {
    const sub: Subscription = {
      id: 'sub-1',
      filter: { contractId: 'C123' },
      callback: mockCallback,
    };

    engine.addSubscription(sub);
    const matches = engine.matchEvent(mockEvent);

    expect(matches).toHaveLength(1);
    expect(matches[0].subscriptionId).toBe('sub-1');
  });

  it('should not match events with different contract ID', () => {
    const sub: Subscription = {
      id: 'sub-1',
      filter: { contractId: 'C456' },
      callback: mockCallback,
    };

    engine.addSubscription(sub);
    const matches = engine.matchEvent(mockEvent);

    expect(matches).toHaveLength(0);
  });

  it('should match events with wildcard topic', () => {
    const sub: Subscription = {
      id: 'sub-1',
      filter: { contractId: 'C123', topic: '*' },
      callback: mockCallback,
    };

    engine.addSubscription(sub);
    const matches = engine.matchEvent(mockEvent);

    expect(matches).toHaveLength(1);
  });

  it('should match events with specific topic', () => {
    const sub: Subscription = {
      id: 'sub-1',
      filter: { contractId: 'C123', topic: 'transfer' },
      callback: mockCallback,
    };

    engine.addSubscription(sub);
    const matches = engine.matchEvent(mockEvent);

    expect(matches).toHaveLength(1);
  });

  it('should not match events with wrong topic', () => {
    const sub: Subscription = {
      id: 'sub-1',
      filter: { contractId: 'C123', topic: 'mint' },
      callback: mockCallback,
    };

    engine.addSubscription(sub);
    const matches = engine.matchEvent(mockEvent);

    expect(matches).toHaveLength(0);
  });

  it('should return multiple matching subscriptions', () => {
    engine.addSubscription({
      id: 'sub-1',
      filter: { contractId: 'C123' },
      callback: mockCallback,
    });
    engine.addSubscription({
      id: 'sub-2',
      filter: { contractId: 'C123', topic: 'transfer' },
      callback: mockCallback,
    });

    const matches = engine.matchEvent(mockEvent);

    expect(matches).toHaveLength(2);
  });

  it('should clear all subscriptions', () => {
    engine.addSubscription({
      id: 'sub-1',
      filter: { contractId: 'C123' },
      callback: mockCallback,
    });

    engine.clear();

    expect(engine.getSubscriptionCount()).toBe(0);
  });
});
