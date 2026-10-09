/**
 * Thin wrapper over the Freighter browser extension, via the official
 * `@stellar/freighter-api` client.
 *
 * Freighter does NOT inject a global object into the page. The client talks to
 * the extension's content script by `window.postMessage`, so the only way to
 * know whether the extension is there is to ask it (`isConnected`). An earlier
 * version of this file looked for a `window.freighterApi` that never exists,
 * which made every real browser report "Freighter was not detected" whether or
 * not the extension was installed.
 *
 * In mock mode a simulated wallet stands in, so the dashboard is usable
 * without the extension.
 */

import {
  getAddress,
  getNetwork,
  isConnected,
  requestAccess,
  signMessage,
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api';
import { API_MODE, STELLAR_NETWORK } from '@/lib/config';

export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletError';
  }
}

const MOCK_ADDRESS = 'GBXK7ZCMLQ4XR2PDTV3M6HSNAWQ2VJLKZ5YQF7TG3WNXHRBUE4C2MOCK';

/** Freighter reports errors as `{ message, code }` objects, never bare strings. */
function describe(error: { message?: string } | string | undefined): string {
  if (!error) return 'Freighter returned an unexpected response';
  return typeof error === 'string' ? error : (error.message ?? 'Freighter returned an error');
}

let detection: Promise<boolean> | null = null;

/**
 * Whether the Freighter extension is installed and answering. Asks it, rather
 * than looking for a global it does not define. When the extension is absent
 * the client gives up after about two seconds, so the answer is cached.
 */
export function detectFreighter(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  detection ??= isConnected()
    .then((result) => result.isConnected === true)
    .catch(() => false);
  return detection;
}

/** Freighter's own names for the networks it can be set to. */
function freighterNetworkName(network: string): string {
  const lower = network.toLowerCase();
  return lower === 'mainnet' || lower === 'public' ? 'PUBLIC' : lower.toUpperCase();
}

/**
 * Freighter ships set to Mainnet. A signature over a Testnet transaction by a
 * wallet on the wrong network fails in ways that look unrelated, so say so
 * plainly before asking for anything.
 */
async function assertExpectedNetwork(): Promise<void> {
  const current = await getNetwork().catch(() => null);
  if (!current || current.error || !current.network) return;

  const expected = freighterNetworkName(STELLAR_NETWORK);
  if (current.network.toUpperCase() !== expected) {
    throw new WalletError(
      `Freighter is set to ${current.network}, but this app uses ${expected}. ` +
        'Switch networks in Freighter (Settings → Network), then try again.',
    );
  }
}

/** Prompts Freighter for access and returns the guarantor's public key. */
export async function connectWallet(): Promise<string> {
  if (!(await detectFreighter())) {
    if (API_MODE === 'mock') return MOCK_ADDRESS;
    throw new WalletError(
      'Freighter was not detected. Install the extension from freighter.app, ' +
        'allow it on this site, then reload this page.',
    );
  }

  await assertExpectedNetwork();

  const access = await requestAccess();
  if (access.error) throw new WalletError(describe(access.error));
  if (!access.address) throw new WalletError('Freighter did not return an account.');
  return access.address;
}

/** Non-intrusively retrieves current public key without triggering access dialog. */
export async function getActiveWalletAddress(): Promise<string | null> {
  if (!(await detectFreighter())) return API_MODE === 'mock' ? MOCK_ADDRESS : null;
  try {
    const result = await getAddress();
    return !result.error && result.address ? result.address : null;
  } catch {
    return null;
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary);
}

/**
 * Signs the backend's auth challenge. The signature is what `POST /auth/verify`
 * exchanges for a session token.
 */
export async function signChallenge(
  challenge: string,
  address: string,
): Promise<string> {
  if (!(await detectFreighter())) {
    if (API_MODE === 'mock') return `mock-signature:${challenge}`;
    throw new WalletError('Freighter was not detected.');
  }

  const result = await signMessage(challenge, { address });
  if (result.error) throw new WalletError(describe(result.error));

  // Newer Freighter returns the signature as a string, older as raw bytes.
  const signed = result.signedMessage;
  if (!signed) throw new WalletError('Freighter did not return a signature.');
  return typeof signed === 'string' ? signed : toBase64(signed);
}

/**
 * Signs a transaction the backend prepared, as the given account. With the
 * contracts connected, every movement of the guarantor's collateral needs
 * this signature: a deposit, a withdrawal, or a new loan.
 */
export async function signTransaction(
  xdr: string,
  networkPassphrase: string,
  address: string,
): Promise<string> {
  if (!(await detectFreighter())) {
    throw new WalletError('Freighter was not detected. Install the extension to sign transactions.');
  }

  const result = await freighterSignTransaction(xdr, { networkPassphrase, address });
  if (result.error) throw new WalletError(describe(result.error));
  if (!result.signedTxXdr) throw new WalletError('Freighter did not return a signed transaction.');
  return result.signedTxXdr;
}
