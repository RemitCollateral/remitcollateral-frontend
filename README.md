# MergeLabs

[![CI](https://github.com/yourusername/MergeLabs/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/MergeLabs/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/yourusername/MergeLabs/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/MergeLabs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Open source npm toolkit monorepo for the Stellar/Soroban blockchain ecosystem.

**Package prefix:** `@astronlabs/*`

**Features:**
- Real Soroban event streaming with XDR decoding
- Production-grade React hooks with Freighter wallet integration
- Real transaction building (Payments, Trustlines, Contract calls)
- Exponential backoff polling for transaction status
- Smart simulation → sign → submit flow for contract calls
- Full testnet integration tests
- Automated CI/CD with coverage reporting

## Packages

| Package | Description | Dependencies |
|---------|-------------|--------------|
| `@astronlabs/notify` | Real-time Soroban contract event listener | None |
| `@astronlabs/mock` | Mock contracts and RPC for testing | None |
| `@astronlabs/hooks` | React hooks for Stellar | `notify` |
| `@astronlabs/forms` | Headless form components | `hooks` |

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## Package: @astronlabs/notify

Real-time Soroban contract event listener with XDR decoding.

```typescript
import { StellarNotify } from '@astronlabs/notify';

const notify = new StellarNotify({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  network: 'testnet',
  pollInterval: 5000
});

const unsubscribe = notify.onTransfer('C...', (event) => {
  console.log('Transfer:', event.data);
});

// Cleanup
unsubscribe();
notify.destroy();
```

## Package: @astronlabs/mock

Mock implementations for testing.

```typescript
import { MockRpc, MockContract, MockFreighter, tokenFixture } from '@astronlabs/mock';

const mockRpc = new MockRpc();
const token = new MockContract(mockRpc, tokenFixture);
const wallet = new MockFreighter({ publicKey: 'G...' });

token.emit('transfer', { from: 'G...', to: 'G...', amount: 100 });
```

## Package: @astronlabs/hooks

React hooks for Stellar integration.

```tsx
import { StellarProvider, useBalance, useFreighter } from '@astronlabs/hooks';

function App() {
  return (
    <StellarProvider rpcUrl="..." network="testnet">
      <Wallet />
    </StellarProvider>
  );
}

function Wallet() {
  const { connect, publicKey, connected } = useFreighter();
  const { balance } = useBalance(publicKey ?? '');

  return connected ? (
    <div>Balance: {balance.toString()}</div>
  ) : (
    <button onClick={connect}>Connect Wallet</button>
  );
}
```

## Package: @astronlabs/forms

Headless form components using render props pattern.

```tsx
import { SendPaymentForm, ConnectWalletButton } from '@astronlabs/forms';

<SendPaymentForm onSuccess={(tx) => console.log(tx)}>
  {({ handleSubmit, loading, values, onChange }) => (
    <form onSubmit={handleSubmit}>
      <input name="to" value={values.to} onChange={onChange} />
      <input name="amount" value={values.amount} onChange={onChange} />
      <button disabled={loading}>Send</button>
    </form>
  )}
</SendPaymentForm>
```

## Tech Stack

- TypeScript (strict mode)
- pnpm workspaces
- tsup for building
- vitest for testing
- @stellar/stellar-sdk for Stellar RPC
- React 18 for hooks and forms

## Development

```bash
# Add dependency to a package
pnpm --filter @astronlabs/notify add dependency-name

# Run tests for specific package
pnpm --filter @astronlabs/notify test

# Run integration tests against live testnet
pnpm test:integration

# Build specific package
pnpm --filter @astronlabs/notify build

# Check coverage
pnpm coverage

# Create changeset for release
pnpm changeset
```

## License

MIT
