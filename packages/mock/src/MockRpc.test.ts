import { describe, it, expect, beforeEach } from 'vitest';
import { MockRpc } from './MockRpc';

describe('MockRpc', () => {
  let mockRpc: MockRpc;

  beforeEach(() => {
    mockRpc = new MockRpc();
  });

  it('should create with default ledger', () => {
    expect(mockRpc.getLatestLedger()).toBe(1);
  });

  it('should create with custom ledger', () => {
    const custom = new MockRpc(1000);
    expect(custom.getLatestLedger()).toBe(1000);
  });

  it('should advance ledger', () => {
    mockRpc.advanceLedger(5);
    expect(mockRpc.getLatestLedger()).toBe(6);
  });

  it('should set ledger', () => {
    mockRpc.setLatestLedger(500);
    expect(mockRpc.getLatestLedger()).toBe(500);
  });

  it('should return health status', () => {
    const response = mockRpc.call('getHealth');
    expect(response.result).toEqual({ status: 'healthy' });
  });

  it('should return latest ledger', () => {
    mockRpc.setLatestLedger(100);
    const response = mockRpc.call('getLatestLedger');
    expect(response.result).toEqual({ sequence: 100 });
  });

  it('should return error for unknown method', () => {
    const response = mockRpc.call('unknownMethod');
    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32601);
  });

  it('should simulate transaction', () => {
    const response = mockRpc.call('simulateTransaction', ['test-xdr']);
    expect(response.result).toHaveProperty('transactionData');
    expect(response.result).toHaveProperty('minResourceFee');
  });

  it('should send transaction', () => {
    const response = mockRpc.call('sendTransaction', ['test-xdr']);
    expect(response.result).toHaveProperty('hash');
  });

  it('should get transaction', () => {
    mockRpc.simulateTransaction({
      txHash: 'test-hash',
      txXdr: 'test-xdr',
      result: { value: 100 },
      success: true,
    });

    const response = mockRpc.call('getTransaction', ['test-hash']);
    expect(response.result).toEqual({
      txHash: 'test-hash',
      txXdr: 'test-xdr',
      result: { value: 100 },
      success: true,
    });
  });

  it('should add and filter events', () => {
    mockRpc.addEvent({
      contractId: 'C123',
      name: 'transfer',
      data: { amount: 100 },
      ledgerSequence: 1,
    });
    mockRpc.addEvent({
      contractId: 'C456',
      name: 'mint',
      data: { amount: 200 },
      ledgerSequence: 1,
    });

    const events = mockRpc.getEvents({ contractId: 'C123' });
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('transfer');
  });

  it('should clear all data', () => {
    mockRpc.addEvent({
      contractId: 'C123',
      name: 'transfer',
      data: {},
      ledgerSequence: 1,
    });
    mockRpc.clear();

    expect(mockRpc.getLatestLedger()).toBe(1);
    expect(mockRpc.getEvents()).toHaveLength(0);
  });

  it('should reset to initial state', () => {
    mockRpc.registerMethod('custom', () => 'value');
    mockRpc.reset();

    // Default methods should still work
    const response = mockRpc.call('getHealth');
    expect(response.result).toEqual({ status: 'healthy' });
  });
});
