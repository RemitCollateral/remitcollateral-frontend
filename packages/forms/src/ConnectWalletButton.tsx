/**
 * Connect Wallet Button Component
 *
 * Headless unstyled button for Freighter wallet connection
 */
import { useFreighter } from '@astronlabs/hooks';
import type { ConnectWalletButtonProps } from './types';

/**
 * Connect Wallet Button - Headless component for wallet connection
 *
 * @example
 * ```tsx
 * <ConnectWalletButton>
 *   {({ onClick, loading, connected, publicKey }) => (
 *     <button onClick={onClick} disabled={loading}>
 *       {loading
 *         ? 'Connecting...'
 *         : connected
 *         ? `${publicKey?.slice(0, 4)}...${publicKey?.slice(-4)}`
 *         : 'Connect Wallet'}
 *     </button>
 *   )}
 * </ConnectWalletButton>
 * ```
 */
export function ConnectWalletButton({ children }: ConnectWalletButtonProps): JSX.Element {
  const { connect, connected, publicKey, loading } = useFreighter();

  /**
   * Handle button click
   */
  const onClick = async (): Promise<void> => {
    if (!connected) {
      await connect();
    }
  };

  const childProps = {
    onClick,
    loading,
    connected,
    publicKey,
  };

  return <>{children(childProps)}</>;
}
