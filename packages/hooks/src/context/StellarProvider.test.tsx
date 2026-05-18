import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StellarProvider, useStellarContext } from './StellarProvider';
import type { StellarContextValue } from '../types';

describe('StellarProvider', () => {
  it('should provide context to children', () => {
    let capturedContext: StellarContextValue | null = null;

    function TestComponent(): JSX.Element {
      capturedContext = useStellarContext();
      return <div>Test</div>;
    }

    render(
      <StellarProvider rpcUrl="https://test.stellar.org" network="testnet">
        <TestComponent />
      </StellarProvider>
    );

    expect(capturedContext).not.toBeNull();
    expect(capturedContext?.config.rpcUrl).toBe('https://test.stellar.org');
    expect(capturedContext?.config.network).toBe('testnet');
    expect(capturedContext?.config.networkPassphrase).toBe(
      'Test SDF Network ; September 2015'
    );
  });

  it('should throw when used outside provider', () => {
    function TestComponent(): JSX.Element {
      useStellarContext();
      return <div>Test</div>;
    }

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useStellarContext must be used within a StellarProvider');

    consoleSpy.mockRestore();
  });

  it('should render children', () => {
    render(
      <StellarProvider rpcUrl="https://test.stellar.org" network="testnet">
        <div data-testid="child">Child Content</div>
      </StellarProvider>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Child Content');
  });
});
