/**
 * @astronlabs/hooks - React hooks for Stellar
 *
 * This package provides React hooks for building Stellar/Soroban
 * applications. It wraps @astronlabs/notify and stellar-sdk for
 * easy integration with React components.
 *
 * @example
 * ```tsx
 * import { StellarProvider, useBalance, useFreighter } from '@astronlabs/hooks';
 *
 * function App() {
 *   return (
 *     <StellarProvider rpcUrl="..." network="testnet">
 *       <WalletInfo />
 *     </StellarProvider>
 *   );
 * }
 *
 * function WalletInfo() {
 *   const { connect, publicKey, connected } = useFreighter();
 *   const { balance } = useBalance(publicKey ?? '');
 *
 *   return (
 *     <div>
 *       {connected ? `Balance: ${balance}` : <button onClick={connect}>Connect</button>}
 *     </div>
 *   );
 * }
 * ```
 */

// Provider
export { StellarProvider, useStellarContext } from './context/StellarProvider';

// Hooks
export { useBalance } from './hooks/useBalance';
export { useSendPayment } from './hooks/useSendPayment';
export { useTransaction } from './hooks/useTransaction';
export { useContractCall } from './hooks/useContractCall';
export { useStellarEvent } from './hooks/useStellarEvent';
export { useFreighter } from './hooks/useFreighter';

// Types
export type {
  StellarConfig,
  StellarContextValue,
  StellarProviderProps,
  BalanceResult,
  SendPaymentResult,
  PaymentParams,
  TransactionResult,
  TransactionStatus,
  ContractCallResult,
  ContractCallParams,
  StellarEventResult,
  FreighterState,
  UseFreighterResult,
} from './types';
