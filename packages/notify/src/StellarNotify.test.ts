import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StellarNotify } from './StellarNotify';
import type { EventCallback, StellarNotifyConfig } from './types';

describe('StellarNotify', () => {
  const config: StellarNotifyConfig = {
    rpcUrl: 'https://soroban-testnet.stellar.org',
    network: 'testnet',
    pollInterval: 100,
  };

  let notify: StellarNotify;

  beforeEach(() => {
    notify = new StellarNotify(config);
  });

  afterEach(() => {
    notify.destroy();
  });

  it('should create instance with config', () => {
    expect(notify).toBeInstanceOf(StellarNotify);
    expect(notify.getSubscriptionCount()).toBe(0);
  });

  it('should subscribe to events with onEvent', () => {
    const callback: EventCallback = vi.fn();

    const unsubscribe = notify.onEvent('C123', 'transfer', callback);

    expect(notify.getSubscriptionCount()).toBe(1);
    expect(typeof unsubscribe).toBe('function');

    unsubscribe();
    expect(notify.getSubscriptionCount()).toBe(0);
  });

  it('should subscribe to transfer events', () => {
    const callback: EventCallback = vi.fn();

    const unsubscribe = notify.onTransfer('C123', callback);

    expect(notify.getSubscriptionCount()).toBe(1);

    unsubscribe();
  });

  it('should subscribe to mint events', () => {
    const callback: EventCallback = vi.fn();

    const unsubscribe = notify.onMint('C123', callback);

    expect(notify.getSubscriptionCount()).toBe(1);

    unsubscribe();
  });

  it('should subscribe to burn events', () => {
    const callback: EventCallback = vi.fn();

    const unsubscribe = notify.onBurn('C123', callback);

    expect(notify.getSubscriptionCount()).toBe(1);

    unsubscribe();
  });

  it('should subscribe to all events', () => {
    const callback: EventCallback = vi.fn();

    const unsubscribe = notify.onAnyEvent('C123', callback);

    expect(notify.getSubscriptionCount()).toBe(1);

    unsubscribe();
  });

  it('should unsubscribe with off by topic', () => {
    notify.onEvent('C123', 'transfer', vi.fn());
    notify.onEvent('C123', 'mint', vi.fn());

    notify.off('C123', 'transfer');

    expect(notify.getSubscriptionCount()).toBe(1);
  });

  it('should unsubscribe all with off', () => {
    notify.onEvent('C123', 'transfer', vi.fn());
    notify.onEvent('C123', 'mint', vi.fn());

    notify.off('C123');

    expect(notify.getSubscriptionCount()).toBe(0);
  });

  it('should support multiple subscriptions', () => {
    notify.onEvent('C123', 'transfer', vi.fn());
    notify.onEvent('C123', 'mint', vi.fn());
    notify.onEvent('C456', 'transfer', vi.fn());

    expect(notify.getSubscriptionCount()).toBe(3);
  });

  it('should clean up on destroy', () => {
    notify.onEvent('C123', 'transfer', vi.fn());
    notify.destroy();

    expect(notify.getSubscriptionCount()).toBe(0);
  });
});
