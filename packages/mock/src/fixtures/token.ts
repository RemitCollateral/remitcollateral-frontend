/**
 * Pre-built mock token contract fixture
 */
import type { ContractFixture } from '../types';

/**
 * Standard token contract fixture (similar to Soroban token contract)
 */
export const tokenFixture: ContractFixture = {
  contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  functions: [
    { name: 'balance_of', args: ['account'], returns: 'i128' },
    { name: 'transfer', args: ['from', 'to', 'amount'], returns: 'void' },
    { name: 'transfer_from', args: ['spender', 'from', 'to', 'amount'], returns: 'void' },
    { name: 'approve', args: ['from', 'spender', 'amount', 'expiration_ledger'], returns: 'void' },
    { name: 'allowance', args: ['from', 'spender'], returns: 'i128' },
    { name: 'mint', args: ['to', 'amount'], returns: 'void' },
    { name: 'burn', args: ['from', 'amount'], returns: 'void' },
    { name: 'burn_from', args: ['spender', 'from', 'amount'], returns: 'void' },
    { name: 'total_supply', args: [], returns: 'i128' },
    { name: 'decimals', args: [], returns: 'u32' },
    { name: 'name', args: [], returns: 'string' },
    { name: 'symbol', args: [], returns: 'string' },
    { name: 'admin', args: [], returns: 'address' },
    { name: 'set_admin', args: ['new_admin'], returns: 'void' },
  ],
  events: [
    { name: 'transfer', fields: ['from', 'to', 'amount'] },
    { name: 'approve', fields: ['from', 'spender', 'amount', 'expiration_ledger'] },
    { name: 'mint', fields: ['admin', 'to', 'amount'] },
    { name: 'burn', fields: ['from', 'amount'] },
    { name: 'clawback', fields: ['admin', 'from', 'amount'] },
  ],
  initialStorage: {
    decimals: 7,
    name: 'Mock Token',
    symbol: 'MOCK',
  },
};

/**
 * XLM (Stellar Lumens) token fixture
 */
export const xlmFixture: ContractFixture = {
  contractId: 'CAS3J7GYL3W25UXMVNBC4YWY5Z2SL7CDQHT37FPOKQFMN2MJ57RPZFGJ',
  functions: [
    { name: 'balance_of', args: ['account'], returns: 'i128' },
    { name: 'transfer', args: ['from', 'to', 'amount'], returns: 'void' },
    { name: 'total_supply', args: [], returns: 'i128' },
    { name: 'decimals', args: [], returns: 'u32' },
    { name: 'name', args: [], returns: 'string' },
    { name: 'symbol', args: [], returns: 'string' },
  ],
  events: [
    { name: 'transfer', fields: ['from', 'to', 'amount'] },
  ],
  initialStorage: {
    decimals: 7,
    name: 'Stellar Lumens',
    symbol: 'XLM',
  },
};

/**
 * USDC token fixture
 */
export const usdcFixture: ContractFixture = {
  contractId: 'CCW67TSZVHMGVN5LZI5XVVNYFXE5DPL7RBJHQGWJQX3GSVM3VRK7KAAA',
  functions: [
    { name: 'balance_of', args: ['account'], returns: 'i128' },
    { name: 'transfer', args: ['from', 'to', 'amount'], returns: 'void' },
    { name: 'transfer_from', args: ['spender', 'from', 'to', 'amount'], returns: 'void' },
    { name: 'approve', args: ['from', 'spender', 'amount', 'expiration_ledger'], returns: 'void' },
    { name: 'allowance', args: ['from', 'spender'], returns: 'i128' },
    { name: 'mint', args: ['to', 'amount'], returns: 'void' },
    { name: 'burn', args: ['from', 'amount'], returns: 'void' },
    { name: 'total_supply', args: [], returns: 'i128' },
    { name: 'decimals', args: [], returns: 'u32' },
    { name: 'name', args: [], returns: 'string' },
    { name: 'symbol', args: [], returns: 'string' },
  ],
  events: [
    { name: 'transfer', fields: ['from', 'to', 'amount'] },
    { name: 'mint', fields: ['admin', 'to', 'amount'] },
    { name: 'burn', fields: ['from', 'amount'] },
  ],
  initialStorage: {
    decimals: 7,
    name: 'USD Coin',
    symbol: 'USDC',
  },
};
