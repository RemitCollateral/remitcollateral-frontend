import { describe, it, expect, vi } from 'vitest';
import { SubscriptionManager } from './SubscriptionManager';
import type { EventCallback } from './types';

describe('SubscriptionManager', () => {
  const manager = new SubscriptionManager();
  const mockCallback: EventCallback = vi.fn();

  beforeEach(() => {
    manager.clear();
  });

  it('should subscribe and return subscription ID', () => {
    const id = manager.subscribe(
      { contractId: 'C123', topic: 'transfer' },
      mockCallback
    );

    expect(typeof id).toBe('string');
    expect(id).toContain('C123');
    expect(id).toContain('transfer');
  });

  it('should track subscription count', () => {
    expect(manager.getSubscriptionCount()).toBe(0);

    manager.subscribe({ contractId: 'C123' }, mockCallback);
    expect(manager.getSubscriptionCount()).toBe(1);

    manager.subscribe({ contractId: 'C456' }, mockCallback);
    expect(manager.getSubscriptionCount()).toBe(2);
  });

  it('should unsubscribe by ID', () => {
    const id = manager.subscribe({ contractId: 'C123' }, mockCallback);

    const removed = manager.unsubscribe(id);

    expect(removed).toBe(true);
    expect(manager.getSubscriptionCount()).toBe(0);
  });

  it('should return false when unsubscribing non-existent ID', () => {
    const removed = manager.unsubscribe('non-existent');

    expect(removed).toBe(false);
  });

  it('should unsubscribe all for contract', () => {
    manager.subscribe({ contractId: 'C123' }, mockCallback);
    manager.subscribe({ contractId: 'C123', topic: 'transfer' }, mockCallback);
    manager.subscribe({ contractId: 'C456' }, mockCallback);

    const removed = manager.unsubscribeAll('C123');

    expect(removed).toBe(2);
    expect(manager.getSubscriptionCount()).toBe(1);
  });

  it('should unsubscribe by topic', () => {
    manager.subscribe({ contractId: 'C123', topic: 'transfer' }, mockCallback);
    manager.subscribe({ contractId: 'C123', topic: 'mint' }, mockCallback);
    manager.subscribe({ contractId: 'C123', topic: 'transfer' }, mockCallback);

    const removed = manager.unsubscribeByTopic('C123', 'transfer');

    expect(removed).toBe(2);
    expect(manager.getSubscriptionCount()).toBe(1);
  });

  it('should check if has subscriptions', () => {
    expect(manager.hasSubscriptions()).toBe(false);

    manager.subscribe({ contractId: 'C123' }, mockCallback);

    expect(manager.hasSubscriptions()).toBe(true);
  });

  it('should get subscriptions for contract', () => {
    manager.subscribe({ contractId: 'C123', topic: 'transfer' }, mockCallback);
    manager.subscribe({ contractId: 'C123', topic: 'mint' }, mockCallback);
    manager.subscribe({ contractId: 'C456' }, mockCallback);

    const subs = manager.getSubscriptions('C123');

    expect(subs).toHaveLength(2);
  });

  it('should expose filter engine', () => {
    const engine = manager.getFilterEngine();

    expect(engine).toBeDefined();
    expect(engine.getSubscriptionCount()).toBe(0);
  });
});
