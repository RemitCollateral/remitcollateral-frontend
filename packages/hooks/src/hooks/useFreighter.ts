/**
 * Hook to connect and manage Freighter wallet
 */
import { useState, useCallback } from 'react';
import type { UseFreighterResult } from '../types';

/**
 * Freighter global type declaration
 */
declare global {
  interface Window {
    freighter?: {
      isConnected: () => Promise<boolean>;
      getPublicKey: () => Promise<string>;
      getNetwork: () => Promise<string>;
      signTransaction: (tx: string, opts?: { networkPassphrase?: string }) => Promise<string>;
      signMessage?: (message: string) => Promise<string>;
    };
  }
}

/**
 * Hook for managing Freighter wallet connection
 *
 * @example
 * ```tsx
 * const { connect, publicKey, connected, loading, signTransaction } = useFreighter();
 *
 * return (
 *   <button onClick={connect} disabled={loading}>
 *     {connected ? publicKey : 'Connect Wallet'}
 *   </button>
 * );
 * ```
 */
export function useFreighter(): UseFreighterResult {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Connect to Freighter wallet
   */
  const connect = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      if (!window.freighter) {
        throw new Error('Freighter wallet not installed');
      }

      const isConnected = await window.freighter.isConnected();
      if (!isConnected) {
        throw new Error('User not connected to Freighter');
      }

      const pk = await window.freighter.getPublicKey();
      setPublicKey(pk);
      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect'));
      setConnected(false);
      setPublicKey(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Disconnect from wallet (clears state)
   */
  const disconnect = useCallback((): void => {
    setConnected(false);
    setPublicKey(null);
    setError(null);
  }, []);

  /**
   * Sign a transaction with Freighter
   */
  const signTransaction = useCallback(
    async (txXdr: string, networkPassphrase?: string): Promise<string> => {
      if (!window.freighter) {
        throw new Error('Freighter wallet not installed');
      }

      if (!connected) {
        throw new Error('Wallet not connected');
      }

      const signed = await window.freighter.signTransaction(txXdr, {
        networkPassphrase,
      });

      return signed;
    },
    [connected]
  );

  return {
    connected,
    publicKey,
    loading,
    error,
    connect,
    disconnect,
    signTransaction,
  };
}
