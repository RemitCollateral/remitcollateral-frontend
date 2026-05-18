/**
 * Stellar Provider Component
 *
 * Wraps your app and provides RPC + wallet configuration to all hooks.
 */
import { createContext, useContext, useMemo } from 'react';
import type { StellarConfig, StellarContextValue, StellarProviderProps } from '../types';

/**
 * Stellar context for sharing configuration
 */
const StellarContext = createContext<StellarContextValue | null>(null);

/**
 * Network passphrases for Stellar networks
 */
const NETWORK_PASSPHRASES: Record<string, string> = {
  testnet: 'Test SDF Network ; September 2015',
  mainnet: 'Public Global Stellar Network ; September 2015',
  futurenet: 'Test SDF Future Network ; October 2022',
};

/**
 * Provider component for Stellar configuration
 *
 * @example
 * ```tsx
 * <StellarProvider
 *   rpcUrl="https://soroban-testnet.stellar.org"
 *   network="testnet"
 * >
 *   <App />
 * </StellarProvider>
 * ```
 */
export function StellarProvider({ rpcUrl, network, children }: StellarProviderProps): JSX.Element {
  const config: StellarConfig = useMemo(
    () => ({
      rpcUrl,
      network,
      networkPassphrase: NETWORK_PASSPHRASES[network],
    }),
    [rpcUrl, network]
  );

  const value: StellarContextValue = {
    config,
    isLoading: false,
    error: null,
  };

  return (
    <StellarContext.Provider value={value}>
      {children}
    </StellarContext.Provider>
  );
}

/**
 * Hook to access the Stellar context
 * @returns Stellar context value
 * @throws Error if used outside of StellarProvider
 */
export function useStellarContext(): StellarContextValue {
  const context = useContext(StellarContext);
  if (!context) {
    throw new Error('useStellarContext must be used within a StellarProvider');
  }
  return context;
}

export { StellarContext };
