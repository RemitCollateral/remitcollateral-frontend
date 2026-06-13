# MergeLabs

A TypeScript-first monorepo of production-ready tooling, React hooks, headless forms, and testing mocks for Stellar and Soroban.

Building on Stellar means solving the same problems over and over — wallet connection, event listening, payment forms, testing mocks. MergeLabs solves them once so you can focus on your product.

It's the Swiss Army knife for Stellar and Soroban integration.

[![CI Status](https://github.com/AstronLabs/MergeLabs/actions/workflows/ci.yml/badge.svg)](https://github.com/AstronLabs/MergeLabs/actions/workflows/ci.yml)
[![Code Coverage](https://codecov.io/gh/AstronLabs/MergeLabs/branch/main/graph/badge.svg)](https://codecov.io/gh/AstronLabs/MergeLabs)
[![npm](https://img.shields.io/badge/npm-%40astronlabs-blue)](https://www.npmjs.com/org/astronlabs)
[![Docs](https://img.shields.io/badge/docs-technical-green)](documentation/documentation.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Motivation

Integrating with Stellar and Soroban can feel repetitive. Developers must build transaction polling mechanisms, decode complex XDR data formats, hand-craft forms, and set up mock RPCs to test basic client-side functionality. Consumer wallets and Horizon endpoints present separate integration challenges, meaning developers write hundreds of lines of boilerplate before writing their first line of application logic.

MergeLabs makes Stellar integration legible and seamless:

*   **Connect and manage wallets**: Connect wallets like Freighter, and handle public keys and signatures without boilerplate.
*   **Stream contract events**: Stream live Soroban events using a cursor-tracked engine that decodes raw XDR data into native JavaScript primitives.
*   **Generate forms with validation**: Implement headless transaction forms for sending, trusting, or swapping assets using the render props pattern.
*   **Test offline**: Mock Freighter wallets, smart contracts, and RPC servers locally using robust testing fixtures.

---

## Features

### `@astronlabs/hooks` (React Hooks)
*   **StellarProvider** — Global context setup for testnet/mainnet network parameters.
*   **useFreighter** — React hook for Freighter wallet connection status and transaction signing.
*   **useBalance** — Cache-optimized hook for retrieving XLM and custom Stellar Asset Contract (SAC) token balances.
*   **useContractCall** — Stateful Soroban contract invocation (simulate $\rightarrow$ sign $\rightarrow$ submit $\rightarrow$ poll).
*   **useSendPayment** — Quick Horizon payment builder.
*   **useTransaction** — RPC poll engine with built-in exponential backoff.

### `@astronlabs/notify` (Event Streaming)
*   **StellarNotify** — High-performance event polling class with configurable intervals.
*   **Cursor Tracking** — Remembers and resumes from the last seen ledger sequence to prevent missed events.
*   **Type-safe Filters** — Topic-based and contract-based routing criteria.
*   **XDR Decoder** — Automatically parses raw base64 XDR events into JS values (strings, bigints, numbers).

### `@astronlabs/forms` (Headless UI Components)
*   **ConnectWalletButton** — Interactive button helper handling wallet status.
*   **SendPaymentForm** — Form handler for native and custom token payments with validation.
*   **TrustlineForm** — Headless component to establish token trustlines.
*   **SwapForm** — Orchestrator for DEX swaps with slippage and path calculations.

### `@astronlabs/mock` (Testing Fixtures)
*   **MockRpc** — Local in-memory Soroban RPC server simulating network latency and failures.
*   **MockFreighter** — Fake Freighter wallet injector for automated testing.
*   **MockContract** — State-holding contract simulators that emit mock events.

---

## Stack

*   **Core Logic**: TypeScript, Node.js
*   **Frontend Integrations**: React, `@stellar/stellar-sdk`
*   **Testing Utilities**: Vitest
*   **Monorepo Tooling**: `pnpm workspaces` + `changesets`

---

## Running it locally

### Setup and Compilation

```bash
# Clone the repository
git clone https://github.com/AstronLabs/MergeLabs.git
cd MergeLabs

# Install dependencies (pnpm is required)
pnpm install

# Build all packages and typings
pnpm build
```

### Running Tests

```bash
# Run unit tests across all packages
pnpm test

# Run tests with coverage reports
pnpm coverage

# Run integration tests against live testnet
pnpm test:integration
```

---

## How it works

### Event Stream Architecture
`@astronlabs/notify` connects to Soroban RPC nodes and polls the `getEvents` endpoint. As new blocks are settled, it runs event topics through a matcher, filtering out noise. The `XdrDecoder` then unpacks the base64 XDR schema:

```
[Soroban RPC] ────> [EventPoller] ────> [FilterEngine] ────> [XdrDecoder] ────> [Client Handler]
   (Base64)         (Ledger Poll)       (Topic Matching)    (BigInt/String)       (Decoded Data)
```

### Contract Execution State Flow
When performing on-chain contract calls, the `useContractCall` hook manages a multi-step lifecycle under the hood:

1.  **Simulate**: Queries Soroban RPC to identify resource footprints, validation rules, and gas fees.
2.  **Sign**: Prompts Freighter wallet extension for transaction signatures.
3.  **Submit**: Broadcasts the signed transaction payload to the network.
4.  **Poll**: Regularly queries transaction status using `useTransaction` backoff queries until the ledger registers success or failure.

---

## Roadmap

*   [x] Core hooks with real transaction support
*   [x] Event streaming with XDR decoding
*   [ ] Multi-wallet adapter system (xBull, Albedo, LOBSTR)
*   [ ] Soroswap DEX integration hooks
*   [ ] Blend lending protocol support
*   [ ] CLI tool for project scaffolding
*   [ ] Contract type generator from WASM specs
*   [ ] Live polling to track network fees and statistics
*   [ ] Historical price indices per asset pair

---

## Documentation

*   **[Technical Documentation](documentation/documentation.md)**: Architecture, data flow, package specs, and state diagrams.
*   **[Contributing Guide](documentation/CONTRIBUTING.md)**: Setup tutorials, command guide, coding standards, and release processes.

---

## License

[MIT](LICENSE) © AstronLabs
