# MergeLabs

**Open-source toolkit for building Stellar/Soroban applications**

[![CI Status](https://github.com/AstronLabs/MergeLabs/actions/workflows/ci.yml/badge.svg)](https://github.com/AstronLabs/MergeLabs/actions/workflows/ci.yml)
[![Code Coverage](https://codecov.io/gh/AstronLabs/MergeLabs/branch/main/graph/badge.svg)](https://codecov.io/gh/AstronLabs/MergeLabs)
[![npm](https://img.shields.io/badge/npm-%40astronlabs-blue)](https://www.npmjs.com/org/astronlabs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

MergeLabs is a TypeScript-first monorepo providing production-ready packages for the Stellar and Soroban blockchain ecosystem. Built with strict typing, comprehensive testing, and real-world use cases in mind.

### Why MergeLabs?

- **Real transaction building** — Not mock implementations. Real Horizon payments, trustlines, and Soroban contract calls
- **Production-tested** — Exponential backoff, error handling, retry logic built-in
- **Developer experience** — Type-safe APIs, JSDoc comments, headless components
- **Wallet agnostic** — Freighter integration with extensibility for more wallets

---

## Packages

| Package | Version | Description | NPM |
|---------|---------|-------------|-----|
| `@astronlabs/notify` | [![npm](https://img.shields.io/npm/v/@astronlabs/notify)](https://www.npmjs.com/package/@astronlabs/notify) | Real-time Soroban event streaming with XDR decoding | [Docs](#astronlabsnotify) |
| `@astronlabs/mock` | [![npm](https://img.shields.io/npm/v/@astronlabs/mock)](https://www.npmjs.com/package/@astronlabs/mock) | Mock RPC, contracts, and wallets for testing | [Docs](#astronlabsmock) |
| `@astronlabs/hooks` | [![npm](https://img.shields.io/npm/v/@astronlabs/hooks)](https://www.npmjs.com/package/@astronlabs/hooks) | React hooks for Stellar integration | [Docs](#astronlabshooks) |
| `@astronlabs/forms` | [![npm](https://img.shields.io/npm/v/@astronlabs/forms)](https://www.npmjs.com/package/@astronlabs/forms) | Headless form components | [Docs](#astronlabsforms) |

---

## Quick Start

### Installation

```bash
# Using pnpm (recommended)
pnpm add @astronlabs/hooks @astronlabs/forms

# Using npm
npm install @astronlabs/hooks @astronlabs/forms

# Using yarn
yarn add @astronlabs/hooks @astronlabs/forms
```

### Basic Usage

```tsx
import { StellarProvider, useFreighter, useBalance } from '@astronlabs/hooks';

function App() {
  return (
    <StellarProvider
      config={{
        network: 'testnet',
        rpcUrl: 'https://soroban-testnet.stellar.org',
      }}
    >
      <Wallet />
    </StellarProvider>
  );
}

function Wallet() {
  const { connect, publicKey, connected } = useFreighter();
  const { balance, loading } = useBalance(publicKey ?? '');

  if (!connected) {
    return <button onClick={connect}>Connect Freighter</button>;
  }

  return (
    <div>
      <p>Address: {publicKey}</p>
      <p>Balance: {loading ? 'Loading...' : balance}</p>
    </div>
  );
}
```

---

## @astronlabs/notify

Real-time event streaming from Soroban smart contracts with automatic XDR decoding.

### Features
- Polls Soroban RPC `getEvents` with configurable intervals
- Automatic XDR decoding to JavaScript objects
- Built-in retry logic with exponential backoff
- Type-safe event filtering

### Example

```typescript
import { StellarNotify } from '@astronlabs/notify';

const notify = new StellarNotify({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  network: 'testnet',
  pollInterval: 5000,
});

// Listen for token transfers
const unsubscribe = notify.onTransfer('CONTRACT_ID', (event) => {
  console.log('Transfer:', {
    from: event.data.from,
    to: event.data.to,
    amount: event.data.amount,
  });
});

// Cleanup
unsubscribe();
notify.destroy();
```

---

## @astronlabs/mock

Mock implementations for isolated testing without network dependencies.

### Features
- Mock RPC server with simulated latency
- Mock contracts with state management
- Mock Freighter wallet for testing
- Pre-built fixtures for common scenarios

### Example

```typescript
import { MockRpc, MockContract, tokenFixture } from '@astronlabs/mock';

const rpc = new MockRpc({ latency: 100 });
const token = new MockContract(rpc, tokenFixture);

// Simulate events
token.emit('transfer', {
  from: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  to: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  amount: 10000000n,
});
```

---

## @astronlabs/hooks

React hooks for Stellar blockchain interactions.

### Features
- `useFreighter` — Wallet connection and transaction signing
- `useBalance` — Account balance fetching with caching
- `useSendPayment` — Real payment transactions (Horizon)
- `useContractCall` — Soroban contract invocation (simulate → sign → submit)
- `useTransaction` — Transaction status polling with backoff

### Example: Sending Payments

```tsx
import { useSendPayment } from '@astronlabs/hooks';

function PaymentForm() {
  const { send, loading, error, result } = useSendPayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await send({
      destination: 'G...',
      amount: '10',
      memo: 'Payment for services',
    });
    
    console.log('Transaction:', result.txHash);
  };

  return (
    <form onSubmit={handleSubmit}>
      <button disabled={loading}>
        {loading ? 'Sending...' : 'Send 10 XLM'}
      </button>
      {error && <p>Error: {error.message}</p>}
      {result && <p>Success! TX: {result.txHash}</p>}
    </form>
  );
}
```

---

## @astronlabs/forms

Headless form components with Stellar transaction integration.

### Features
- Render props pattern for full UI control
- Built-in validation
- Automatic wallet connection checks
- Error handling with user-friendly messages

### Example

```tsx
import { SendPaymentForm } from '@astronlabs/forms';

<SendPaymentForm
  onSuccess={(result) => console.log('Sent:', result.txHash)}
  onError={(err) => console.error('Failed:', err.message)}
>
  {({ handleSubmit, loading, values, onChange, errors }) => (
    <form onSubmit={handleSubmit}>
      <input
        name="destination"
        value={values.destination}
        onChange={onChange}
        placeholder="G..."
      />
      {errors.destination && <span>{errors.destination}</span>}
      
      <input
        name="amount"
        value={values.amount}
        onChange={onChange}
        placeholder="Amount in XLM"
      />
      {errors.amount && <span>{errors.amount}</span>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Payment'}
      </button>
    </form>
  )}
</SendPaymentForm>
```

---

## Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

```bash
# Clone the repository
git clone https://github.com/AstronLabs/MergeLabs.git
cd MergeLabs

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run type checking
pnpm typecheck
```

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm test` | Run unit tests |
| `pnpm test:integration` | Run tests against live testnet |
| `pnpm coverage` | Generate coverage reports |
| `pnpm lint` | Run linting |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm changeset` | Create a changeset for release |

### Project Structure

```
MergeLabs/
├── packages/
│   ├── notify/          # Event streaming
│   ├── mock/            # Testing utilities
│   ├── hooks/           # React hooks
│   └── forms/           # Form components
├── .github/
│   └── workflows/       # CI/CD pipelines
├── pnpm-workspace.yaml  # pnpm workspace config
└── README.md            # This file
```

---

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @astronlabs/notify test

# Watch mode
pnpm --filter @astronlabs/hooks test:watch
```

### Integration Tests

Tests that run against live Stellar testnet infrastructure:

```bash
pnpm test:integration
```

These verify real RPC calls, Horizon queries, and event polling work correctly.

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Quick Contributing Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Run the test suite (`pnpm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

---

## Roadmap

- [x] Core hooks with real transaction support
- [x] Event streaming with XDR decoding
- [ ] Multi-wallet adapter system (xBull, Albedo, LOBSTR)
- [ ] Soroswap DEX integration hooks
- [ ] Blend lending protocol support
- [ ] CLI tool for project scaffolding
- [ ] Contract type generator from WASM specs

---

## License

[MIT](./LICENSE) © AstronLabs

---

## Acknowledgments

- [Stellar Development Foundation](https://stellar.org) for the Soroban platform
- [Freighter](https://freighter.app) for wallet integration
- The Stellar open-source community

---

Built with ❤️ for the Stellar ecosystem
