import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockContract } from './MockContract';
import { MockRpc } from './MockRpc';
import type { ContractFixture } from './types';

describe('MockContract', () => {
  const mockRpc = new MockRpc();

  const tokenFixture: ContractFixture = {
    contractId: 'C123TOKEN',
    functions: [
      { name: 'balance_of', args: ['account'], returns: 'u64' },
      { name: 'transfer', args: ['from', 'to', 'amount'], returns: 'bool' },
      { name: 'total_supply', args: [], returns: 'u64' },
      { name: 'decimals', args: [], returns: 'u32' },
      { name: 'name', args: [], returns: 'string' },
    ],
    events: [
      { name: 'transfer', fields: ['from', 'to', 'amount'] },
      { name: 'mint', fields: ['to', 'amount'] },
    ],
    initialStorage: {
      initialized: true,
    },
  };

  let contract: MockContract;

  beforeEach(() => {
    mockRpc.clear();
    contract = new MockContract(mockRpc, tokenFixture);
  });

  it('should create contract with fixture', () => {
    expect(contract.getContractId()).toBe('C123TOKEN');
  });

  it('should call existing function', () => {
    const result = contract.call('balance_of', { account: 'G...' });

    expect(result.success).toBe(true);
    expect(result.value).toBe(1000n);
  });

  it('should fail on unknown function', () => {
    const result = contract.call('unknown_function');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Function not found');
  });

  it('should emit events', () => {
    const handler = vi.fn();
    contract.on('transfer', handler);

    contract.emit('transfer', { from: 'G1', to: 'G2', amount: 100 });

    expect(handler).toHaveBeenCalledWith({ from: 'G1', to: 'G2', amount: 100 });
  });

  it('should emit events on transfer call', () => {
    const handler = vi.fn();
    contract.on('transfer', handler);

    contract.call('transfer', { from: 'G1', to: 'G2', amount: 50 });

    expect(handler).toHaveBeenCalledWith({ from: 'G1', to: 'G2', amount: 50 });
  });

  it('should get and set storage', () => {
    contract.setStorage('test_key', 'test_value');

    expect(contract.getStorage('test_key')).toBe('test_value');
  });

  it('should get all storage', () => {
    contract.setStorage('key1', 'value1');
    contract.setStorage('key2', 42);

    const storage = contract.getAllStorage();

    expect(storage).toHaveProperty('initialized', true);
    expect(storage).toHaveProperty('key1', 'value1');
    expect(storage).toHaveProperty('key2', 42);
  });

  it('should get functions list', () => {
    const funcs = contract.getFunctions();

    expect(funcs).toHaveLength(5);
    expect(funcs[0].name).toBe('balance_of');
  });

  it('should get events list', () => {
    const events = contract.getEvents();

    expect(events).toHaveLength(2);
    expect(events[0].name).toBe('transfer');
  });

  it('should return common token values', () => {
    expect(contract.call('total_supply').value).toBe(1000000n);
    expect(contract.call('decimals').value).toBe(7);
    expect(contract.call('name').value).toBe('Mock Token');
  });

  it('should unsubscribe from events', () => {
    const handler = vi.fn();
    const unsubscribe = contract.on('transfer', handler);

    unsubscribe();
    contract.emit('transfer', { amount: 100 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should clear storage and handlers', () => {
    contract.setStorage('key', 'value');
    contract.on('transfer', vi.fn());

    contract.clear();

    expect(contract.getStorage('key')).toBeUndefined();
  });
});
