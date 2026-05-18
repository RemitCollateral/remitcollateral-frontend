/**
 * Hook to send XLM or token payments
 */
import { useState, useCallback } from 'react';
import { useStellarContext } from '../context/StellarProvider';
import type { SendPaymentResult, PaymentParams } from '../types';

/**
 * Hook for sending XLM or token payments
 *
 * @example
 * ```tsx
 * const { send, loading, error, txHash } = useSendPayment();
 *
 * const handleSend = async () => {
 *   try {
 *     const hash = await send({
 *       to: 'G...',
 *       amount: '100',
 *       asset: 'XLM'
 *     });
 *     console.log('Sent:', hash);
 *   } catch (e) {
 *     console.error('Failed:', e);
 *   }
 * };
 * ```
 */
export function useSendPayment(): SendPaymentResult {
  const { config } = useStellarContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  /**
   * Send payment transaction
   */
  const send = useCallback(
    async (params: PaymentParams): Promise<string> => {
      setLoading(true);
      setError(null);
      setTxHash(null);

      try {
        // For Soroban contracts (tokens), we'd build a contract invocation
        // For native XLM, we'd use a payment operation

        if (params.asset && params.asset !== 'XLM') {
          // Token payment - invoke contract transfer
          // This requires a signed transaction from the user
          // Implementation depends on wallet integration
          throw new Error(
            'Token payments require wallet signing. Use useFreighter + useContractCall'
          );
        }

        // Native XLM payment
        // In a real implementation, this would:
        // 1. Load source account from Horizon
        // 2. Build payment operation
        // 3. Sign with user's wallet
        // 4. Submit to Horizon or RPC

        // Placeholder implementation
        const mockHash = `tx_${Date.now()}_${params.to.slice(0, 8)}`;
        setTxHash(mockHash);
        return mockHash;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Payment failed');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [config]
  );

  return {
    send,
    loading,
    error,
    txHash,
  };
}
