import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for integration tests
 *
 * These tests run against live Stellar testnet services.
 * They may fail if testnet is unavailable.
 *
 * Run with: vitest run --config vitest.integration.config.ts
 */
export default defineConfig({
  test: {
    include: ['packages/*/src/integration.test.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 30000, // 30s for network calls
    // Don't fail on testnet unavailability
    retry: 1,
  },
});
