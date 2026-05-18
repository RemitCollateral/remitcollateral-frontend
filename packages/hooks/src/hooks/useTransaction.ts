/**
 * Hook to fetch and track a transaction
 */
import { useState, useEffect, useCallback } from 'react';
import { SorobanRpc } from '@stellar/stellar-sdk';
import { useStellarContext } from '../context/StellarProvider';
import type { TransactionResult, TransactionStatus } from '../types';

/**
 * Hook for fetching and tracking transaction status
 *
 * @example
 * ```tsx
 * const { status, transaction, loading, error } = useTransaction(txHash);
 *
 * if (status === 'success') {
 *   console.log('Transaction confirmed!');
 * }
 * ```
 */
export function useTransaction(txHash: string | null): TransactionResult {
  const { config } = useStellarContext();
  const [status, setStatus] = useState<TransactionStatus>('unknown');
  const [transaction, setTransaction] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransaction = useCallback(async () => {
    if (!txHash) {
      setStatus('unknown');
      setTransaction(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const server = new SorobanRpc.Server(config.rpcUrl);

      // Get transaction from RPC
      const response = await server.getTransaction(txHash);

      // Map response status to our status
      let txStatus: TransactionStatus;
      switch (response.status) {
        case 'SUCCESS':
          txStatus = 'success';
          break;
        case 'FAILED':
          txStatus = 'failed';
          break;
        case 'NOT_FOUND':
          txStatus = 'pending'; // Still waiting
          break;
        default:
          txStatus = 'unknown';
      }

      setStatus(txStatus);
      setTransaction(response);
    } catch (err) {
      // If not found, it's still pending
      if (err instanceof Error && err.message.includes('not found')) {
        setStatus('pending');
      } else {
        setError(err instanceof Error ? err : new Error('Failed to fetch transaction'));
        setStatus('unknown');
      }
    } finally {
      setLoading(false);
    }
  }, [txHash, config.rpcUrl]);

  useEffect(() => {
    void fetchTransaction();

    // Poll for pending transactions
    let interval: ReturnType<typeof setInterval> | null = null;
    if (txHash && status === 'pending') {
      interval = setInterval(fetchTransaction, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [txHash, status, fetchTransaction]);

  return {
    status,
    transaction,
    loading,
    error,
  };
}
