/**
 * Mock Freighter wallet for testing
 */
import type { FreighterState, FreighterOptions } from './types';

/**
 * Freighter network passphrases
 */
export const NETWORK_PASSPHRASES = {
  testnet: 'Test SDF Network ; September 2015',
  mainnet: 'Public Global Stellar Network ; September 2015',
  futurenet: 'Test SDF Future Network ; October 2022',
};

/**
 * Mock Freighter wallet for testing
 *
 * @example
 * ```typescript
 * const wallet = new MockFreighter({
 *   publicKey: 'G...'
 * });
 *
 * await wallet.connect();
 * const pk = await wallet.getPublicKey();
 * const signed = await wallet.signTransaction(txXdr);
 * ```
 */
export class MockFreighter {
  private state: FreighterState;
  private options: FreighterOptions;

  /**
   * Creates a new MockFreighter instance
   * @param options - Freighter options
   */
   constructor(options: FreighterOptions) {
    this.options = {
      network: NETWORK_PASSPHRASES.testnet,
      ...options,
    };
    this.state = {
      connected: false,
      publicKey: null,
      network: this.options.network,
    };
  }

  /**
   * Checks if Freighter is installed (always true for mock)
   * @returns Promise resolving to true
   */
  isConnected(): Promise<boolean> {
    return Promise.resolve(this.state.connected);
  }

  /**
   * Connects to the mock wallet
   * @returns Promise resolving to connection result
   */
  connect(): Promise<{ publicKey: string; network: string }> {
    this.state = {
      connected: true,
      publicKey: this.options.publicKey,
      network: this.options.network,
    };

    return Promise.resolve({
      publicKey: this.options.publicKey,
      network: this.options.network,
    });
  }

  /**
   * Disconnects from the mock wallet
   */
  disconnect(): void {
    this.state = {
      connected: false,
      publicKey: null,
      network: this.options.network,
    };
  }

  /**
   * Gets the public key when connected
   * @returns Promise resolving to public key
   * @throws Error if not connected
   */
  getPublicKey(): Promise<string> {
    if (!this.state.connected || !this.state.publicKey) {
      return Promise.reject(new Error('Wallet not connected'));
    }
    return Promise.resolve(this.state.publicKey);
  }

  /**
   * Gets the network passphrase
   * @returns Promise resolving to network passphrase
   */
  getNetwork(): Promise<string> {
    return Promise.resolve(this.state.network);
  }

  /**
   * Signs a transaction (mock implementation)
   * @param txXdr - Transaction XDR
   * @returns Promise resolving to signed transaction XDR
   */
  signTransaction(txXdr: string): Promise<string> {
    if (!this.state.connected) {
      return Promise.reject(new Error('Wallet not connected'));
    }

    // Mock signing - just append mock signature data
    const mockSigned = `${txXdr}_signed_by_${this.state.publicKey?.slice(0, 8)}`;
    return Promise.resolve(mockSigned);
  }

  /**
   * Signs an authentication message (mock implementation)
   * @param message - Message to sign
   * @returns Promise resolving to signature
   */
  signMessage(message: string): Promise<string> {
    if (!this.state.connected) {
      return Promise.reject(new Error('Wallet not connected'));
    }

    // Mock message signature
    const signature = `sig_${Buffer.from(message).toString('base64').slice(0, 20)}_${Date.now()}`;
    return Promise.resolve(signature);
  }

  /**
   * Gets the current wallet state
   * @returns Current state
   */
  getState(): FreighterState {
    return { ...this.state };
  }

  /**
   * Simulates a network change
   * @param network - New network passphrase
   */
  setNetwork(network: string): void {
    this.state.network = network;
    if (this.options) {
      this.options.network = network;
    }
  }

  /**
   * Simulates a connection rejection
   */
  simulateRejection(): Promise<never> {
    return Promise.reject(new Error('User rejected connection'));
  }

  /**
   * Simulates a signing rejection
   */
  simulateSignRejection(): Promise<never> {
    return Promise.reject(new Error('User rejected transaction signing'));
  }
}
