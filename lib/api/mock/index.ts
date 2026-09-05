/**
 * Mock implementation of the API transport, backed by the in-memory store.
 * Every call is wrapped in a small latency so loading states are real.
 */

import type { RemitCollateralApi } from '../types';
import { mockStore } from './store';
import { MOCK_WALLET } from './fixtures';

const LATENCY_MS = 220;

function delay<T>(value: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(value());
      } catch (error) {
        reject(error);
      }
    }, LATENCY_MS);
  });
}

export const mockApi: RemitCollateralApi = {
  getChallenge: (walletAddress) =>
    delay(() => ({
      wallet_address: walletAddress,
      challenge: `remitcollateral-auth:${walletAddress}:${Date.now()}`,
      expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
    })),

  verifyChallenge: (walletAddress) =>
    delay(() => {
      const guarantor = mockStore.guarantor();
      return {
        token: 'mock-session-token',
        // The mock accepts any wallet and binds the seeded guarantor to it.
        guarantor: { ...guarantor, wallet_address: walletAddress || MOCK_WALLET },
        expires_at: new Date(Date.now() + 24 * 3_600_000).toISOString(),
      };
    }),

  getMe: () => delay(() => mockStore.guarantor()),
  getDashboard: () => delay(() => mockStore.dashboard()),

  getVault: () => delay(() => mockStore.vault()),
  depositCollateral: (amountUsd) => delay(() => mockStore.deposit(amountUsd)),
  withdrawCollateral: (amountUsd) => delay(() => mockStore.withdraw(amountUsd)),

  listBeneficiaries: () => delay(() => mockStore.beneficiaries()),
  getBeneficiary: (id) => delay(() => mockStore.beneficiary(id)),
  createBeneficiary: (input) => delay(() => mockStore.createBeneficiary(input)),
  getReputation: (id) => delay(() => mockStore.reputation(id)),

  listLoans: () => delay(() => mockStore.loans()),
  getLoan: (id) => delay(() => mockStore.loan(id)),
  getLoanSchedule: (id) => delay(() => mockStore.loan(id).schedule),
  createLoan: (input) => delay(() => mockStore.createLoan(input)),
  getRepayments: (loanId) => delay(() => mockStore.repayments(loanId)),

  listRemittances: () => delay(() => mockStore.remittances()),
  createRemittance: (input) => delay(() => mockStore.createRemittance(input)),
};

export { resetMockStore } from './store';
