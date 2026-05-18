import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventPoller } from './EventPoller';
import type { StellarNotifyConfig } from './types';

describe('EventPoller', () => {
  const mockConfig: Required<StellarNotifyConfig> = {
    rpcUrl: 'https://soroban-testnet.stellar.org',
    network: 'testnet',
    pollInterval: 100,
    maxRetries: 2,
    retryDelayMs: 10,
  };

  const mockHandler = vi.fn();
  let poller: EventPoller;

  beforeEach(() => {
    mockHandler.mockClear();
    poller = new EventPoller(mockConfig, mockHandler);
  });

  afterEach(() => {
    poller.stop();
  });

  it('should create poller instance', () => {
    expect(poller).toBeInstanceOf(EventPoller);
    expect(poller.isPolling()).toBe(false);
  });

  it('should start polling', () => {
    poller.start();
    expect(poller.isPolling()).toBe(true);
  });

  it('should stop polling', () => {
    poller.start();
    poller.stop();
    expect(poller.isPolling()).toBe(false);
  });

  it('should not start if already running', () => {
    poller.start();
    poller.start(); // Second start should be no-op
    expect(poller.isPolling()).toBe(true);
  });

  it('should provide access to cursor state', () => {
    const cursorState = poller.getCursorState();
    expect(cursorState).toBeDefined();
    expect(cursorState.getLastLedgerSequence()).toBe(0);
  });
});
