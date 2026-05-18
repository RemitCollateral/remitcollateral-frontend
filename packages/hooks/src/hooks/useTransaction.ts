/**
 * Hook to fetch and track a transaction with exponential backoff polling
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { SorobanRpc } from '@stellar/stellar-sdk';
import { useStellarContext } from '../context/StellarProvider';
import type { TransactionResult, TransactionStatus } from '../types';

/** Polling configuration */
interface PollingConfig {
  /** Initial poll interval in ms (default: 1000) */
  initialInterval: number;
  /** Maximum poll interval in ms (default: 15000) */
  maxInterval: number;
  /** Maximum number of polls (default: 60) */
  maxPolls: number;
  /** Exponential backoff multiplier (default: 1.5) */
  backoffMultiplier: number;
}

/** Default polling config ~1 min of polling */
const DEFAULT_POLLING: PollingConfig = {
  initialInterval: 1000,
  maxInterval: 15000,
  maxPolls: 60,
  backoffMultiplier: 1.5,
};

/**
 * Calculate next poll interval with exponential backoff
 */
function calculateNextInterval(
  currentInterval: number,
  _attempt: number,
  config: PollingConfig
): number {
  const next = Math.min(
    currentInterval * config.backoffMultiplier,
    config.maxInterval
  );
  // Add jitter (0-20% randomness) to prevent thundering herd
  const jitter = Math.random() * 0.2 * next;
  return next + jitter;
}

/**
 * Hook for fetching and tracking transaction status with smart polling
 *
 * @example
 * ```tsx
 * const { status, transaction, loading, error, isPolling } = useTransaction(txHash);
 *
 * if (status === 'success') {
 *   console.log('Transaction confirmed!');
 * }
 * ```
 */
export function useTransaction(
  txHash: string | null,
  polling?: Partial<PollingConfig>
): TransactionResult {
  const { config } = useStellarContext();
  const [status, setStatus] = useState<TransactionStatus>('unknown');
  const [transaction, setTransaction] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Polling state refs to avoid stale closures
  const pollCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPollingRef = useRef(false);

  const pollConfig: PollingConfig = { ...DEFAULT_POLLING, ...polling };

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
          txStatus = 'pending';
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
    // Reset state when txHash changes
    pollCountRef.current = 0;
    isPollingRef.current = false;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    void fetchTransaction();

    // Exponential backoff polling for pending transactions
    const scheduleNextPoll = (currentInterval: number): void => {
      if (pollCountRef.current >= pollConfig.maxPolls) {
        isPollingRef.current = false;
        return;
      }

      timeoutRef.current = setTimeout(async () => {
        await fetchTransaction();

        // Continue polling if still pending
        if (status === 'pending' && isPollingRef.current) {
          pollCountRef.current++;
          const nextInterval = calculateNextInterval(
            currentInterval,
            pollCountRef.current,
            pollConfig
          );
          scheduleNextPoll(nextInterval);
        }
      }, currentInterval);
    };

    if (txHash && status === 'pending' && !isPollingRef.current) {
      isPollingRef.current = true;
      scheduleNextPoll(pollConfig.initialInterval);
    }

    return () => {
      isPollingRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [txHash, status, fetchTransaction, pollConfig]);

  return {
    status,
    transaction,
    loading,
    error,
  };
}
