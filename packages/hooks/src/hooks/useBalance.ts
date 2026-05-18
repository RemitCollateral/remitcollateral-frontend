/**
 * Hook to fetch XLM and token balances
 */
import { useState, useEffect, useCallback } from 'react';
import { useStellarContext } from '../context/StellarProvider';
import type { BalanceResult } from '../types';

/**
 * Fetches balance for a public key (XLM or token)
 *
 * @example
 * ```tsx
 * const { balance, loading, error, refetch } = useBalance(publicKey);
 * if (loading) return <div>Loading...</div>;
 * return <div>Balance: {balance.toString()}</div>;
 * ```
 */
export function useBalance(
  publicKey: string,
  options: { contractId?: string } = {}
): BalanceResult {
  const { config } = useStellarContext();
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(BigInt(0));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Placeholder: real implementation would query Horizon or simulate contract call
      setBalance(BigInt(0));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch balance'));
    } finally {
      setLoading(false);
    }
  }, [publicKey, options.contractId, config.rpcUrl]);

  useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  const refetch = useCallback(() => {
    void fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refetch,
  };
}
