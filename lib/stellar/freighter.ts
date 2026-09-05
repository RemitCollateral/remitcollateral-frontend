/**
 * Thin wrapper over the Freighter browser extension.
 *
 * Freighter injects `window.freighterApi`, so no SDK dependency is needed for
 * the two things guarantor auth requires: reading the public key, and signing
 * the backend's challenge. In mock mode a simulated wallet stands in, so the
 * dashboard is usable without the extension installed.
 */

import { API_MODE, STELLAR_NETWORK } from '@/lib/config';

/** Shape of the injected object, kept loose across Freighter versions. */
interface FreighterApi {
  isConnected?: () => Promise<boolean | { isConnected: boolean }>;
  requestAccess?: () => Promise<string | { address: string; error?: string }>;
  getPublicKey?: () => Promise<string>;
  getAddress?: () => Promise<{ address: string; error?: string }>;
  signMessage?: (
    message: string,
    opts?: { network?: string; networkPassphrase?: string; address?: string },
  ) => Promise<string | { signedMessage: string; signerAddress?: string; error?: string }>;
  signBlob?: (
    blob: string,
    opts?: { network?: string; accountToSign?: string },
  ) => Promise<string | { signedBlob: string; error?: string }>;
}

declare global {
  interface Window {
    freighterApi?: FreighterApi;
  }
}

export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

const MOCK_ADDRESS = 'GBXK7ZCMLQ4XR2PDTV3M6HSNAWQ2VJLKZ5YQF7TG3WNXHRBUE4C2MOCK';

function extension(): FreighterApi | null {
  if (typeof window === 'undefined') return null;
  return window.freighterApi ?? null;
}

/** Whether a real wallet is available to sign. False in mock mode by design. */
export function isFreighterInstalled(): boolean {
  return extension() !== null;
}

/** True when the app is standing in for a wallet rather than using one. */
export function isSimulatedWallet(): boolean {
  return API_MODE === 'mock' && !isFreighterInstalled();
}

function unwrap<T extends object, K extends keyof T>(
  result: string | T,
  key: K,
): string {
  if (typeof result === 'string') return result;
  if ('error' in result && result.error) {
    throw new WalletError(String(result.error));
  }
  const value = result[key];
  if (typeof value !== 'string' || !value) {
    throw new WalletError('Freighter returned an unexpected response');
  }
  return value;
}

/** Prompts Freighter for access and returns the guarantor's public key. */
export async function connectWallet(): Promise<string> {
  const api = extension();

  if (!api) {
    if (API_MODE === 'mock') return MOCK_ADDRESS;
    throw new WalletError(
      'Freighter was not detected. Install the extension to connect your wallet.',
    );
  }

  if (api.requestAccess) {
    const result = await api.requestAccess();
    const address = typeof result === 'string' ? result : result.address;
    if (address) return address;
    if (typeof result !== 'string' && result.error) {
      throw new WalletError(String(result.error));
    }
  }

  if (api.getAddress) return unwrap(await api.getAddress(), 'address');
  if (api.getPublicKey) return await api.getPublicKey();

  throw new WalletError('This version of Freighter is not supported.');
}

/**
 * Signs the backend's auth challenge. The signature is what `POST /auth/verify`
 * exchanges for a session token.
 */
export async function signChallenge(
  challenge: string,
  address: string,
): Promise<string> {
  const api = extension();

  if (!api) {
    if (API_MODE === 'mock') return `mock-signature:${challenge}`;
    throw new WalletError('Freighter was not detected.');
  }

  if (api.signMessage) {
    const result = await api.signMessage(challenge, {
      network: STELLAR_NETWORK,
      address,
    });
    return unwrap(result, 'signedMessage');
  }

  if (api.signBlob) {
    const encoded =
      typeof window === 'undefined' ? challenge : window.btoa(challenge);
    const result = await api.signBlob(encoded, {
      network: STELLAR_NETWORK,
      accountToSign: address,
    });
    return unwrap(result, 'signedBlob');
  }

  throw new WalletError('This version of Freighter cannot sign messages.');
}
