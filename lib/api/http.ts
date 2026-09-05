/**
 * HTTP implementation of the API transport, talking to the backend at
 * NEXT_PUBLIC_API_URL. Selected when NEXT_PUBLIC_API_MODE=live.
 */

import { API_URL } from '@/lib/config';
import { getSessionToken, clearSession } from '@/lib/session';
import type { Beneficiary, DashboardData } from '@/lib/types';
import { ApiError, type RemitCollateralApi } from './types';

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = init;

  const token = auth ? getSessionToken() : null;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 401) {
    clearSession();
    throw new ApiError('Session expired. Reconnect your wallet.', 401);
  }

  if (!response.ok) {
    const details = await response.json().catch(() => null);
    const message =
      (details && typeof details === 'object' && 'message' in details
        ? String((details as { message: unknown }).message)
        : null) ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, details);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function post<T>(path: string, body: unknown, auth = true): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body), auth });
}

export const httpApi: RemitCollateralApi = {
  getChallenge: (walletAddress) =>
    request(`/auth/challenge?wallet_address=${encodeURIComponent(walletAddress)}`, {
      auth: false,
    }),
  verifyChallenge: (walletAddress, signature) =>
    post('/auth/verify', { wallet_address: walletAddress, signature }, false),

  getMe: () => request('/guarantors/me'),
  getDashboard: () => request('/guarantors/me/dashboard'),

  getVault: () => request('/vaults/me'),
  depositCollateral: (amountUsd, txHash) =>
    post('/vaults/deposit', { amount_usd: amountUsd, tx_hash: txHash }),
  withdrawCollateral: (amountUsd) => post('/vaults/withdraw', { amount_usd: amountUsd }),

  // v1 has no list endpoint for beneficiaries — they are reachable through the
  // dashboard payload, which carries every beneficiary the guarantor has linked.
  listBeneficiaries: async () => {
    const dashboard = await request<DashboardData>('/guarantors/me/dashboard');
    const byId = new Map<string, Beneficiary>();
    for (const loan of dashboard.loans) {
      byId.set(loan.beneficiary.id, loan.beneficiary);
    }
    return [...byId.values()];
  },
  getBeneficiary: (id) => request(`/beneficiaries/${id}`),
  createBeneficiary: (input) => post('/beneficiaries', input),
  getReputation: (id) => request(`/beneficiaries/${id}/reputation`),

  listLoans: () => request('/loans'),
  getLoan: (id) => request(`/loans/${id}`),
  getLoanSchedule: (id) => request(`/loans/${id}/schedule`),
  createLoan: (input) => post('/loans', input),
  getRepayments: (loanId) => request(`/loans/${loanId}/repayments`),

  listRemittances: () => request('/remittances'),
  createRemittance: (input) => post('/remittances', input),
};
