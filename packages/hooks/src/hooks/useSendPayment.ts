/**
 * Hook to send XLM or token payments
 */
import { useState, useCallback } from 'react';
import {
  Horizon,
  Networks,
  Asset,
  Operation,
  TransactionBuilder,
  BASE_FEE,
  Memo,
} from '@stellar/stellar-sdk';
import { useStellarContext } from '../context/StellarProvider';
import { useFreighter } from './useFreighter';
import type { SendPaymentResult, PaymentParams } from '../types';

/** Network passphrases */
const NETWORK_PASSPHRASES: Record<string, string> = {
  testnet: Networks.TESTNET,
  mainnet: Networks.PUBLIC,
  futurenet: Networks.FUTURENET,
};

/** Horizon URLs */
const HORIZON_URLS: Record<string, string> = {
  testnet: 'https://horizon-testnet.stellar.org',
  mainnet: 'https://horizon.stellar.org',
  futurenet: 'https://horizon-futurenet.stellar.org',
};

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
  const { publicKey, signTransaction, connected } = useFreighter();
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
        if (!connected || !publicKey) {
          throw new Error('Wallet not connected. Connect with useFreighter first.');
        }

        // Token payments via contract
        if (params.asset && params.asset !== 'XLM') {
          throw new Error(
            'Token payments require Soroban contract invocation. Use useContractCall'
          );
        }

        // Use provided horizon URL or default for network
        const horizonUrl = config.horizonUrl ?? HORIZON_URLS[config.network] ?? HORIZON_URLS.testnet;
        const server = new Horizon.Server(horizonUrl);
        const networkPassphrase = config.networkPassphrase ?? NETWORK_PASSPHRASES[config.network] ?? Networks.TESTNET;

        // Load source account
        const account = await server.loadAccount(publicKey);

        // Build payment operation
        const amount = params.amount;
        const destination = params.to;

        // Create memo if provided
        const memo = params.memo ? Memo.text(params.memo) : undefined;

        // Build transaction
        const transaction = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase,
        })
          .addOperation(
            Operation.payment({
              destination,
              asset: Asset.native(),
              amount,
            })
          )
          .setTimeout(30);

        if (memo) {
          transaction.addMemo(memo);
        }

        const builtTx = transaction.build();
        const txXdr = builtTx.toXDR();

        // Sign with Freighter
        const signedXdr = await signTransaction(txXdr, networkPassphrase);

        // Submit to Horizon
        const result = await server.submitTransaction(
          TransactionBuilder.fromXDR(signedXdr, networkPassphrase)
        );

        const hash = result.hash;
        setTxHash(hash);
        return hash;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Payment failed');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [config, connected, publicKey, signTransaction]
  );

  return {
    send,
    loading,
    error,
    txHash,
  };
}
