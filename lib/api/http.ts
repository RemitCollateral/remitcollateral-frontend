/**
 * HTTP implementation of the API transport, talking to the backend at
 * NEXT_PUBLIC_API_URL. Selected when NEXT_PUBLIC_API_MODE=live.
 */

import { API_URL } from '@/lib/config';
import { getSessionToken, clearSession, getStoredGuarantor } from '@/lib/session';
import { signTransaction } from '@/lib/stellar/freighter';
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

/** A transaction the backend prepared for the guarantor's wallet to sign. */
interface PreparedTransaction {
  xdr: string;
  hash: string;
  network_passphrase: string;
}

let chainStatus: Promise<boolean> | null = null;

/**
 * Whether the backend is connected to the contracts, asked once per page load.
 * When it is, collateral moves only with the guarantor's wallet signature.
 */
function chainEnabled(): Promise<boolean> {
  chainStatus ??= request<{ enabled: boolean }>('/chain', { auth: false })
    .then((status) => status.enabled)
    .catch(() => {
      chainStatus = null;
      return false;
    });
  return chainStatus;
}

/**
 * Has the backend prepare a transaction, asks the wallet to sign it as the
 * signed-in guarantor, and submits the signature.
 */
async function signed<T>(path: string, body: unknown): Promise<T> {
  const prepared = await post<PreparedTransaction>(`${path}/prepare`, body);
  const wallet = getStoredGuarantor()?.wallet_address;
  if (!wallet) {
    throw new ApiError('Reconnect your wallet to sign this transaction.', 401);
  }
  const signedXdr = await signTransaction(prepared.xdr, prepared.network_passphrase, wallet);
  return post<T>(`${path}/submit`, { hash: prepared.hash, signed_xdr: signedXdr });
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
  depositCollateral: async (amountUsd, txHash) =>
    (await chainEnabled())
      ? signed('/vaults/deposit', { amount_usd: amountUsd })
      : post('/vaults/deposit', { amount_usd: amountUsd, tx_hash: txHash }),
  withdrawCollateral: async (amountUsd) =>
    (await chainEnabled())
      ? signed('/vaults/withdraw', { amount_usd: amountUsd })
      : post('/vaults/withdraw', { amount_usd: amountUsd }),

  listBeneficiaries: () => request('/beneficiaries'),
  getBeneficiary: (id) => request(`/beneficiaries/${id}`),
  createBeneficiary: (input) => post('/beneficiaries', input),
  getReputation: (id) => request(`/beneficiaries/${id}/reputation`),

  getExchangeRate: (currency) => request(`/fx/rates/${encodeURIComponent(currency)}`),

  listLoans: () => request('/loans'),
  getLoan: (id) => request(`/loans/${id}`),
  getLoanSchedule: (id) => request(`/loans/${id}/schedule`),
  createLoan: async (input) =>
    (await chainEnabled()) ? signed('/loans', input) : post('/loans', input),
  getRepayments: (loanId) => request(`/loans/${loanId}/repayments`),

  listRemittances: () => request('/remittances'),
  createRemittance: (input) => post('/remittances', input),
};
