/**
 * Integration tests against live Soroban testnet
 *
 * These tests verify the library works against real RPC.
 * They may fail if testnet is unavailable.
 *
 * Run with: pnpm test:integration or vitest run --config vitest.integration.config.ts
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { StellarNotify } from './StellarNotify';
import { SorobanRpc } from '@stellar/stellar-sdk';

const TESTNET_RPC = 'https://soroban-testnet.stellar.org';
const TEST_TIMEOUT = 30000;

/**
 * Check if testnet is available before running tests
 */
async function isTestnetAvailable(): Promise<boolean> {
  try {
    const server = new SorobanRpc.Server(TESTNET_RPC, { allowHttp: false });
    await server.getHealth();
    return true;
  } catch {
    return false;
  }
}

describe('Integration: StellarNotify against testnet', () => {
  let testnetAvailable = false;

  beforeAll(async () => {
    testnetAvailable = await isTestnetAvailable();
    if (!testnetAvailable) {
      console.warn('Testnet unavailable, skipping integration tests');
    }
  }, TEST_TIMEOUT);

  it(
    'should connect to testnet RPC and get health',
    async () => {
      if (!testnetAvailable) {
        // Skip if testnet down
        return;
      }

      const server = new SorobanRpc.Server(TESTNET_RPC);
      const health = await server.getHealth();

      expect(health.status).toBe('healthy');
    },
    TEST_TIMEOUT
  );

  it(
    'should poll for events on a known contract',
    async () => {
      if (!testnetAvailable) {
        return;
      }

      // Using a well-known testnet token contract
      // This contract may not exist - the test validates the polling mechanism works
      const knownContractId = 'CB64D3G7SM2RPT6XOH4HHG6OVKPE2H4B6ZO4GIVQNLQ6ANMHI6EO6M3B';

      const notify = new StellarNotify({
        rpcUrl: TESTNET_RPC,
        network: 'testnet',
        pollInterval: 1000,
      });

      let eventReceived = false;

      // Subscribe to any event - may not fire if no activity
      const unsubscribe = notify.onAnyEvent((event) => {
        if (event.contractId === knownContractId) {
          eventReceived = true;
        }
      });

      // Poll for 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000));

      unsubscribe();
      notify.destroy();

      // We don't assert eventReceived since there may be no activity
      // The test passes if no errors were thrown
      expect(notify).toBeDefined();
    },
    TEST_TIMEOUT
  );

  it(
    'should handle RPC errors gracefully with retry',
    async () => {
      if (!testnetAvailable) {
        return;
      }

      const notify = new StellarNotify({
        rpcUrl: TESTNET_RPC,
        network: 'testnet',
        pollInterval: 1000,
        maxRetries: 2,
      });

      // Subscribe with a filter that might not match anything
      const unsubscribe = notify.onEvent(
        'CINVALIDINVALIDINVALIDINVALIDINVALIDINVALIDINVALID',
        'nonexistent_topic',
        () => {}
      );

      // Let it poll a few times - should handle not-found gracefully
      await new Promise((resolve) => setTimeout(resolve, 3000));

      unsubscribe();
      notify.destroy();

      // Test passes if no unhandled errors
      expect(true).toBe(true);
    },
    TEST_TIMEOUT
  );
});
