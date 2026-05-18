import { describe, it, expect, beforeEach } from 'vitest';
import { MockFreighter, NETWORK_PASSPHRASES } from './MockFreighter';

describe('MockFreighter', () => {
  const testPublicKey = 'GCFXHS4GFGTGXZHKM3KMVJFGITDZL7QJJKLBQWGJPPTWRHML32V5K6S4';
  let wallet: MockFreighter;

  beforeEach(() => {
    wallet = new MockFreighter({
      publicKey: testPublicKey,
      network: NETWORK_PASSPHRASES.testnet,
    });
  });

  it('should create wallet with options', () => {
    const state = wallet.getState();
    expect(state.connected).toBe(false);
    expect(state.publicKey).toBeNull();
    expect(state.network).toBe(NETWORK_PASSPHRASES.testnet);
  });

  it('should connect and return public key', async () => {
    const result = await wallet.connect();

    expect(result.publicKey).toBe(testPublicKey);
    expect(result.network).toBe(NETWORK_PASSPHRASES.testnet);

    const state = wallet.getState();
    expect(state.connected).toBe(true);
    expect(state.publicKey).toBe(testPublicKey);
  });

  it('should disconnect and clear state', async () => {
    await wallet.connect();
    wallet.disconnect();

    const state = wallet.getState();
    expect(state.connected).toBe(false);
    expect(state.publicKey).toBeNull();
  });

  it('should return isConnected status', async () => {
    expect(await wallet.isConnected()).toBe(false);

    await wallet.connect();
    expect(await wallet.isConnected()).toBe(true);
  });

  it('should get public key when connected', async () => {
    await wallet.connect();
    const pk = await wallet.getPublicKey();
    expect(pk).toBe(testPublicKey);
  });

  it('should throw when getting public key while disconnected', async () => {
    await expect(wallet.getPublicKey()).rejects.toThrow('Wallet not connected');
  });

  it('should sign transaction when connected', async () => {
    await wallet.connect();
    const txXdr = 'AAAAAgAAAABiCG8...';

    const signed = await wallet.signTransaction(txXdr);

    expect(signed).toContain(txXdr);
    expect(signed).toContain('signed_by');
  });

  it('should throw when signing while disconnected', async () => {
    const txXdr = 'AAAAAgAAAABiCG8...';
    await expect(wallet.signTransaction(txXdr)).rejects.toThrow('Wallet not connected');
  });

  it('should sign message when connected', async () => {
    await wallet.connect();
    const message = 'Hello Stellar!';

    const signature = await wallet.signMessage(message);

    expect(signature).toContain('sig_');
  });

  it('should get network', async () => {
    const network = await wallet.getNetwork();
    expect(network).toBe(NETWORK_PASSPHRASES.testnet);
  });

  it('should set network', () => {
    wallet.setNetwork(NETWORK_PASSPHRASES.mainnet);
    expect(wallet.getState().network).toBe(NETWORK_PASSPHRASES.mainnet);
  });

  it('should simulate rejection', async () => {
    await expect(wallet.simulateRejection()).rejects.toThrow('User rejected connection');
  });

  it('should simulate sign rejection', async () => {
    await expect(wallet.simulateSignRejection()).rejects.toThrow('User rejected transaction signing');
  });
});
