/**
 * HTTP implementation of the API transport, talking to the backend at
 * NEXT_PUBLIC_API_URL. Selected when NEXT_PUBLIC_API_MODE=live.
 */

import { API_URL } from '@/lib/config';
import { getSessionToken, clearSession, getStoredGuarantor } from '@/lib/session';
import { signTransaction } from '@/lib/stellar/freighter';
import type { Beneficiary } from '@/lib/types';
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

  listBeneficiaries: async () => {
    try {
      const direct = await request<Beneficiary[]>('/beneficiaries');
      if (Array.isArray(direct)) return direct;
    } catch {
      // Fallback if GET /beneficiaries list endpoint is unsupported
    }

    const byId = new Map<string, Beneficiary>();
    try {
      const dashboard = await request<{ loans?: Array<{ beneficiary: Beneficiary }> }>('/guarantors/me/dashboard');
      for (const loan of dashboard.loans ?? []) {
        if (loan?.beneficiary?.id) {
          byId.set(loan.beneficiary.id, loan.beneficiary);
        }
      }
    } catch {
      // Ignore dashboard fetch error and continue with local cache
    }

    // Hydrate any beneficiaries registered locally in this browser
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(window.localStorage.getItem('rc.registered_beneficiaries') || '[]');
        if (Array.isArray(stored)) {
          for (const b of stored) {
            if (b?.id && !byId.has(b.id)) {
              byId.set(b.id, b);
            }
          }
        }
      } catch {
        // Ignore storage parse error
      }
    }

    return [...byId.values()];
  },
  getBeneficiary: (id) => request(`/beneficiaries/${id}`),
  createBeneficiary: async (input) => {
    const created = await post<Beneficiary>('/beneficiaries', input);
    if (typeof window !== 'undefined' && created?.id) {
      try {
        const existing = JSON.parse(window.localStorage.getItem('rc.registered_beneficiaries') || '[]');
        const updated = [created, ...existing.filter((b: Beneficiary) => b?.id !== created.id)];
        window.localStorage.setItem('rc.registered_beneficiaries', JSON.stringify(updated.slice(0, 50)));
      } catch {
        // Ignore storage write error
      }
    }
    return created;
  },
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
