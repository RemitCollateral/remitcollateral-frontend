/**
 * Hook to call any Soroban contract function
 */
import { useState, useCallback } from 'react';
import { SorobanRpc, Contract, TransactionBuilder, Keypair, Account } from '@stellar/stellar-sdk';
import { useStellarContext } from '../context/StellarProvider';
import type { ContractCallResult, ContractCallParams } from '../types';

/**
 * Hook for calling Soroban smart contract functions
 *
 * @example
 * ```tsx
 * const { call, result, loading, error } = useContractCall();
 *
 * const handleClick = async () => {
 *   const result = await call({
 *     contractId: 'C...',
 *     function: 'get_balance',
 *     args: [{ address: 'G...' }]
 *   });
 * };
 * ```
 */
export function useContractCall(): ContractCallResult {
  const { config } = useStellarContext();
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Call a contract function
   */
  const call = useCallback(
    async (params: ContractCallParams): Promise<unknown> => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const server = new SorobanRpc.Server(config.rpcUrl);

        // Create contract instance
        const contract = new Contract(params.contractId);

        // Build the operation
        const operation = contract.call(
          params.function,
          ...(params.args ?? [])
        );

        // Create a dummy source account for simulation
        // In real usage, you'd use the user's actual account
        const sourceKeypair = Keypair.random();
        const sourceAccount = new Account(sourceKeypair.publicKey(), '0');

        // Build transaction
        const transaction = new TransactionBuilder(sourceAccount, {
          fee: '100',
          networkPassphrase: config.networkPassphrase,
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

        // Extract result
        if ('result' in simulation && simulation.result) {
          // Parse the result - this is simplified
          setResult(simulation.result.retval);
          return simulation.result.retval;
        }

        return null;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Contract call failed');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [config.rpcUrl, config.networkPassphrase]
  );

  return {
    call,
    result,
    loading,
    error,
  };
}
