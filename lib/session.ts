/**
 * Session storage for the wallet-authenticated guarantor.
 *
 * The session token lives in localStorage: it is issued by the backend after
 * a signed challenge, and every API request carries it as a bearer token.
 */

import type { Guarantor } from './types';

const TOKEN_KEY = 'rc.session.token';
const GUARANTOR_KEY = 'rc.session.guarantor';

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    // Storage can throw in private-browsing or embedded contexts.
    return null;
  }
}

export function getSessionToken(): string | null {
  return storage()?.getItem(TOKEN_KEY) ?? null;
}

export function getStoredGuarantor(): Guarantor | null {
  const raw = storage()?.getItem(GUARANTOR_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Guarantor;
  } catch {
    return null;
  }
}

export function saveSession(token: string, guarantor: Guarantor): void {
  const store = storage();
  if (!store) return;
  store.setItem(TOKEN_KEY, token);
  store.setItem(GUARANTOR_KEY, JSON.stringify(guarantor));
}

export function clearSession(): void {
  const store = storage();
  if (!store) return;
  store.removeItem(TOKEN_KEY);
  store.removeItem(GUARANTOR_KEY);
}
