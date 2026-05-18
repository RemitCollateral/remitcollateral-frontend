/**
 * Pre-built mock escrow contract fixture
 */
import type { ContractFixture } from '../types';

/**
 * Escrow contract fixture for secure multi-party transactions
 */
export const escrowFixture: ContractFixture = {
  contractId: 'CDTDRURCXRS2MLLFZMD55MPF4RQ4DUXJRHQV5KQNQFYADQCMVTFZAT6F',
  functions: [
    { name: 'initialize', args: ['buyer', 'seller', 'token', 'amount'], returns: 'void' },
    { name: 'deposit', args: ['by'], returns: 'void' },
    { name: 'release', args: [], returns: 'void' },
    { name: 'refund', args: [], returns: 'void' },
    { name: 'dispute', args: ['by'], returns: 'void' },
    { name: 'resolve_dispute', args: ['winner'], returns: 'void' },
    { name: 'get_state', args: [], returns: 'string' },
    { name: 'get_balance', args: [], returns: 'i128' },
    { name: 'get_buyer', args: [], returns: 'address' },
    { name: 'get_seller', args: [], returns: 'address' },
    { name: 'is_deposited', args: [], returns: 'bool' },
    { name: 'get_expiration', args: [], returns: 'u64' },
  ],
  events: [
    { name: 'initialized', fields: ['escrow_id', 'buyer', 'seller', 'amount'] },
    { name: 'deposited', fields: ['escrow_id', 'by', 'amount'] },
    { name: 'released', fields: ['escrow_id', 'to', 'amount'] },
    { name: 'refunded', fields: ['escrow_id', 'to', 'amount'] },
    { name: 'disputed', fields: ['escrow_id', 'by'] },
    { name: 'resolved', fields: ['escrow_id', 'winner'] },
  ],
  initialStorage: {
    state: 'pending',
    deposited: false,
  },
};

/**
 * Multi-signature escrow fixture with approvers
 */
export const multisigEscrowFixture: ContractFixture = {
  contractId: 'CCHT33MGWQKCBM67LNTLEMBX3VGQYXBMZZ2P4DQMZHLVG7WWXFZKGV6A',
  functions: [
    { name: 'initialize', args: ['proposer', 'recipients', 'amounts', 'threshold'], returns: 'void' },
    { name: 'approve', args: ['by'], returns: 'void' },
    { name: 'reject', args: ['by'], returns: 'void' },
    { name: 'execute', args: [], returns: 'void' },
    { name: 'cancel', args: ['by'], returns: 'void' },
    { name: 'get_approvers', args: [], returns: 'vec' },
    { name: 'get_rejectors', args: [], returns: 'vec' },
    { name: 'get_threshold', args: [], returns: 'u32' },
    { name: 'get_approval_count', args: [], returns: 'u32' },
    { name: 'is_approved', args: ['address'], returns: 'bool' },
    { name: 'can_execute', args: [], returns: 'bool' },
  ],
  events: [
    { name: 'proposed', fields: ['proposal_id', 'proposer', 'total_amount'] },
    { name: 'approved', fields: ['proposal_id', 'by'] },
    { name: 'rejected', fields: ['proposal_id', 'by'] },
    { name: 'executed', fields: ['proposal_id', 'recipients'] },
    { name: 'cancelled', fields: ['proposal_id', 'by'] },
  ],
  initialStorage: {
    state: 'proposed',
    approval_count: 0,
    threshold: 2,
  },
};

/**
 * Time-locked escrow fixture
 */
export const timelockedEscrowFixture: ContractFixture = {
  contractId: 'CDP3TWRGAHQTVJ5HK7QTZDNXM4KRS5ZOBXJHOEHWHY2EJDJXWG6BKMWH',
  functions: [
    { name: 'initialize', args: ['sender', 'recipient', 'token', 'amount', 'unlock_time'], returns: 'void' },
    { name: 'lock', args: [], returns: 'void' },
    { name: 'claim', args: [], returns: 'void' },
    { name: 'cancel', args: ['by'], returns: 'void' },
    { name: 'extend_time', args: ['new_unlock_time'], returns: 'void' },
    { name: 'get_unlock_time', args: [], returns: 'u64' },
    { name: 'is_locked', args: [], returns: 'bool' },
    { name: 'is_claimable', args: [], returns: 'bool' },
    { name: 'get_remaining_time', args: [], returns: 'u64' },
  ],
  events: [
    { name: 'locked', fields: ['escrow_id', 'sender', 'recipient', 'amount', 'unlock_time'] },
    { name: 'claimed', fields: ['escrow_id', 'by', 'amount'] },
    { name: 'cancelled', fields: ['escrow_id', 'by'] },
    { name: 'extended', fields: ['escrow_id', 'new_unlock_time'] },
  ],
  initialStorage: {
    locked: false,
    claimed: false,
  },
};
