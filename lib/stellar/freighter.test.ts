import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * These tests stand up a fake Freighter *content script* at the
 * `window.postMessage` boundary and drive the real `@stellar/freighter-api`
 * client (and so our wallet module) through it. That is the one place the
 * real extension and the page actually meet, which is what the earlier code
 * got wrong: it looked for a `window.freighterApi` global that Freighter never
 * defines, so no real browser could ever connect.
 *
 * The request/response shapes below are copied from the client's own source.
 * What this cannot prove is behaviour of the real extension build itself.
 */

const REQUEST = 'FREIGHTER_EXTERNAL_MSG_REQUEST';
const RESPONSE = 'FREIGHTER_EXTERNAL_MSG_RESPONSE';
const ADDRESS = 'GDRLPQ7UAJW4KH6RXXAFWHL64OZDQ3RTLMJDPIKI45KKFRESVVG3CHA4';
const TESTNET = { network: 'TESTNET', networkPassphrase: 'Test SDF Network ; September 2015' };

interface FakeExtension {
  network: { network: string; networkPassphrase: string };
  apiError?: { code: number; message: string };
  requests: Array<Record<string, any>>;
}

function respond(ext: FakeExtension, req: Record<string, any>): Record<string, unknown> {
  switch (req.type) {
    case 'REQUEST_CONNECTION_STATUS':
      return { isConnected: true };
    case 'REQUEST_NETWORK_DETAILS':
      return { networkDetails: ext.network };
    case 'REQUEST_ACCESS':
    case 'REQUEST_PUBLIC_KEY':
      return { publicKey: ADDRESS, apiError: ext.apiError };
    case 'SUBMIT_BLOB':
      return { signedBlob: 'c2lnbmVk', signerAddress: ADDRESS, apiError: ext.apiError };
    case 'SUBMIT_TRANSACTION':
      return { signedTransaction: 'SIGNED_XDR', signerAddress: ADDRESS, apiError: ext.apiError };
    default:
      return {};
  }
}

/** A browser window. With `ext`, a Freighter content script is listening; without, nobody is. */
function installBrowser(ext: FakeExtension | null) {
  const listeners = new Set<(event: { source: unknown; data: unknown }) => void>();
  const win: Record<string, any> = {
    location: { origin: 'https://app.test' },
    btoa: (s: string) => Buffer.from(s, 'binary').toString('base64'),
    addEventListener: (_: string, l: (e: { source: unknown; data: unknown }) => void) => listeners.add(l),
    removeEventListener: (_: string, l: (e: { source: unknown; data: unknown }) => void) => listeners.delete(l),
    postMessage: (data: Record<string, any>) => {
      if (!ext || data?.source !== REQUEST) return; // nobody home
      ext.requests.push(data);
      const reply = respond(ext, data);
      setTimeout(() => {
        for (const l of [...listeners]) {
          l({ source: win, data: { source: RESPONSE, messagedId: data.messageId, ...reply } });
        }
      }, 0);
    },
  };
  vi.stubGlobal('window', win);
  return win;
}

async function loadWallet(mode: 'live' | 'mock') {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_API_MODE', mode);
  vi.stubEnv('NEXT_PUBLIC_STELLAR_NETWORK', 'testnet');
  return import('./freighter');
}

const extension = (over: Partial<FakeExtension> = {}): FakeExtension => ({
  network: TESTNET,
  requests: [],
  ...over,
});

beforeEach(() => {
  vi.useRealTimers();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('detecting Freighter', () => {
  it('finds it by asking the extension, even though no window.freighterApi exists', async () => {
    const win = installBrowser(extension());
    // The thing the old code required. A real Freighter never defines it.
    expect(win.freighterApi).toBeUndefined();

    const wallet = await loadWallet('live');
    expect(await wallet.detectFreighter()).toBe(true);
  });

  it('reports it missing when nothing answers, after the client gives up', async () => {
    vi.useFakeTimers();
    installBrowser(null);
    const wallet = await loadWallet('live');

    const found = wallet.detectFreighter();
    await vi.advanceTimersByTimeAsync(2100);
    expect(await found).toBe(false);
  });

  it('is false on the server, where there is no window', async () => {
    const wallet = await loadWallet('live');
    expect(await wallet.detectFreighter()).toBe(false);
  });
});

describe('connecting', () => {
  it('returns the account Freighter grants', async () => {
    installBrowser(extension());
    const wallet = await loadWallet('live');
    expect(await wallet.connectWallet()).toBe(ADDRESS);
  });

  it('refuses plainly when Freighter is on the wrong network', async () => {
    installBrowser(extension({ network: { network: 'PUBLIC', networkPassphrase: 'Public Global Stellar Network ; September 2015' } }));
    const wallet = await loadWallet('live');

    await expect(wallet.connectWallet()).rejects.toThrow(/PUBLIC.*TESTNET/s);
  });

  it("shows Freighter's own message when the user declines, not [object Object]", async () => {
    installBrowser(extension({ apiError: { code: -4, message: 'The user rejected this request.' } }));
    const wallet = await loadWallet('live');

    await expect(wallet.connectWallet()).rejects.toThrow('The user rejected this request.');
  });

  it('tells a live-mode user with no extension how to fix it', async () => {
    vi.useFakeTimers();
    installBrowser(null);
    const wallet = await loadWallet('live');

    const attempt = wallet.connectWallet();
    const assertion = expect(attempt).rejects.toThrow(/Freighter was not detected.*freighter\.app/s);
    await vi.advanceTimersByTimeAsync(2100);
    await assertion;
  });

  it('uses the simulated wallet in mock mode when there is no extension', async () => {
    vi.useFakeTimers();
    installBrowser(null);
    const wallet = await loadWallet('mock');

    const attempt = wallet.connectWallet();
    await vi.advanceTimersByTimeAsync(2100);
    expect(await attempt).toMatch(/MOCK$/);
  });
});

describe('signing', () => {
  it('signs the sign-in challenge for the connected account', async () => {
    const ext = extension();
    installBrowser(ext);
    const wallet = await loadWallet('live');

    expect(await wallet.signChallenge('Sign in to RemitCollateral', ADDRESS)).toBe('c2lnbmVk');

    const request = ext.requests.find((r) => r.type === 'SUBMIT_BLOB');
    expect(request?.accountToSign).toBe(ADDRESS);
    expect(request?.blob).toBe('Sign in to RemitCollateral');
  });

  it('signs a prepared transaction on the network the backend named', async () => {
    const ext = extension();
    installBrowser(ext);
    const wallet = await loadWallet('live');

    const signed = await wallet.signTransaction('UNSIGNED_XDR', TESTNET.networkPassphrase, ADDRESS);
    expect(signed).toBe('SIGNED_XDR');

    const request = ext.requests.find((r) => r.type === 'SUBMIT_TRANSACTION');
    expect(request?.transactionXdr).toBe('UNSIGNED_XDR');
    expect(request?.networkPassphrase).toBe(TESTNET.networkPassphrase);
    expect(request?.accountToSign).toBe(ADDRESS);
  });

  it('surfaces a signing rejection as a readable error', async () => {
    installBrowser(extension({ apiError: { code: -4, message: 'The user rejected this request.' } }));
    const wallet = await loadWallet('live');

    await expect(wallet.signTransaction('X', TESTNET.networkPassphrase, ADDRESS)).rejects.toThrow(
      'The user rejected this request.',
    );
  });
});
