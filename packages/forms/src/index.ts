/**
 * @astronlabs/forms - Headless React components for Stellar UI flows
 *
 * This package provides headless, unstyled React components for common
 * Stellar blockchain UI flows. It uses the render prop pattern, allowing
 * developers to bring their own styles and UI.
 *
 * @example
 * ```tsx
 * import {
 *   SendPaymentForm,
 *   ConnectWalletButton,
 *   StellarProvider
 * } from '@astronlabs/forms';
 *
 * function App() {
 *   return (
 *     <StellarProvider rpcUrl="..." network="testnet">
 *       <ConnectWalletButton>
 *         {({ onClick, loading, connected, publicKey }) => (
 *           <button onClick={onClick} disabled={loading}>
 *             {connected ? publicKey : 'Connect Wallet'}
 *           </button>
 *         )}
 *       </ConnectWalletButton>
 *
 *       <SendPaymentForm onSuccess={(tx) => console.log(tx)}>
 *         {({ handleSubmit, loading, values, onChange }) => (
 *           <form onSubmit={handleSubmit}>
 *             <input name="to" value={values.to} onChange={onChange} />
 *             <input name="amount" value={values.amount} onChange={onChange} />
 *             <button disabled={loading}>Send</button>
 *           </form>
 *         )}
 *       </SendPaymentForm>
 *     </StellarProvider>
 *   );
 * }
 * ```
 */

// Re-export StellarProvider from hooks
export { StellarProvider, useStellarContext } from '@astronlabs/hooks';

// Forms
export { SendPaymentForm } from './SendPaymentForm';
export { SwapForm } from './SwapForm';
export { TrustlineForm } from './TrustlineForm';

// Components
export { ConnectWalletButton } from './ConnectWalletButton';

// Types
export type {
  FormValues,
  FormErrors,
  FormChildProps,
  BaseFormProps,
  SendPaymentValues,
  SendPaymentFormProps,
  SwapValues,
  SwapFormProps,
  TrustlineValues,
  TrustlineFormProps,
  ConnectWalletButtonProps,
} from './types';
