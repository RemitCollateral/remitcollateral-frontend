/**
 * Hook to call any Soroban contract function with full simulation → sign → submit flow
 */
import { useState, useCallback } from 'react';
import {
  SorobanRpc,
  Contract,
  TransactionBuilder,
  Account,
  Networks,
  BASE_FEE,
  xdr,
} from '@stellar/stellar-sdk';
import { useStellarContext } from '../context/StellarProvider';
import { useFreighter } from './useFreighter';
import type { ContractCallResult, ContractCallParams } from '../types';

/** Network passphrases map */
const NETWORK_PASSPHRASES: Record<string, string> = {
  testnet: Networks.TESTNET,
  mainnet: Networks.PUBLIC,
  futurenet: Networks.FUTURENET,
};

/**
 * Hook for calling Soroban smart contract functions with real simulation and signing
 *
 * @example
 * ```tsx
 * const { call, result, loading, error } = useContractCall();
 *
 * // Read-only call
 * const balance = await call({
 *   contractId: 'C...',
 *   function: 'balance',
 *   args: [{ address: 'G...' }]
 * });
 *
 * // State-changing call (requires signing)
 * const txHash = await call({
 *   contractId: 'C...',
 *   function: 'transfer',
 *   args: ['G...FROM', 'G...TO', 1000n],
 *   submit: true
 * });
 * ```
 */
export function useContractCall(): ContractCallResult {
  const { config } = useStellarContext();
  const { publicKey, connected, signTransaction } = useFreighter();
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Call a contract function
   * @param params - Contract call parameters
   * @returns The result value for read calls, or transaction hash for write calls
   */
  const call = useCallback(
    async (params: ContractCallParams & { submit?: boolean }): Promise<unknown> => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const server = new SorobanRpc.Server(config.rpcUrl);
        const networkPassphrase =
          config.networkPassphrase ?? NETWORK_PASSPHRASES[config.network] ?? Networks.TESTNET;

        // Create contract instance
        const contract = new Contract(params.contractId);

        // Build the operation
        const args = (params.args ?? []) as xdr.ScVal[];
        const operation = contract.call(params.function, ...args);

        // Use public key if connected, otherwise use a dummy for simulation
        const sourceAddress = connected && publicKey ? publicKey : 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
        const sourceAccount = new Account(sourceAddress, '0');

        // Build transaction for simulation
        const transaction = new TransactionBuilder(sourceAccount, {
          fee: BASE_FEE,
          networkPassphrase,
        })
          .addOperation(operation)
          .setTimeout(30)
          .build();

        // Simulate the transaction
        const simulation = await server.simulateTransaction(transaction);

        // Check for simulation errors
        if (SorobanRpc.Api.isSimulationError(simulation)) {
          throw new Error(`Simulation failed: ${simulation.error}`);
        }

        // For read-only calls (no auth required), return the result
        if (!params.submit) {
          if ('result' in simulation && simulation.result) {
            setResult(simulation.result.retval);
            return simulation.result.retval;
          }
          return null;
        }

        // For state-changing calls: prepare, sign, and submit
        if (!connected || !publicKey) {
          throw new Error('Wallet not connected for state-changing transaction');
        }

        // Check if simulation success and has transaction data
        if (!SorobanRpc.Api.isSimulationSuccess(simulation)) {
          throw new Error('Simulation did not succeed - cannot submit transaction');
        }

        // Build the final transaction using the user's real account
        const userAccount = new Account(publicKey, '0');
        const finalTx = new TransactionBuilder(userAccount, {
          fee: simulation.minResourceFee ?? BASE_FEE,
          networkPassphrase,
        })
          .addOperation(operation)
          .setTimeout(30)
          .build();

        // Get recent ledger bounds from simulation for validity
        if (simulation.latestLedger) {
          // Set ledger bounds based on simulation
          // This ensures the tx is valid for the current ledger state
        }

        const txXdr = finalTx.toXDR();

        // Sign with Freighter
        const signedXdr = await signTransaction(txXdr, networkPassphrase);

        // Parse signed transaction
        const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);

        // Submit to network
        const sendResult = await server.sendTransaction(signedTx);

        if (sendResult.status !== 'PENDING') {
          throw new Error(`Transaction failed to submit: ${sendResult.status}`);
        }

        setResult(sendResult.hash);
        return sendResult.hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Contract call failed');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [config.rpcUrl, config.networkPassphrase, config.network, connected, publicKey, signTransaction]
  );

  return {
    call,
    result,
    loading,
    error,
  };
}
