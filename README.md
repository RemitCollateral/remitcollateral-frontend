# RemitCollateral — Guarantor Dashboard

> Crypto-collateralized lending for local beneficiaries who never touch crypto.

The frontend of the RemitCollateral protocol. A diaspora member connects a Stellar
wallet, locks USDC as collateral, and originates a loan for a relative or business
contact back home. The beneficiary receives local currency through an off-ramp
partner, repays through the channel they already use, and never needs a wallet.

This repository is the guarantor's view of that system: what their collateral is
doing, which loans it backs, what is due next, and — stated plainly, before they
commit — what they stand to lose.

---

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000. The app ships with `NEXT_PUBLIC_API_MODE=mock`, so it
runs fully without a backend: a simulated wallet stands in for Freighter, and a
seeded in-memory dataset drives every screen.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development server on port 3000 |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint via `next lint` |
| `pnpm typecheck` | `tsc --noEmit` |

## Environment

| Variable | Values | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_API_MODE` | `mock` \| `live` | `mock` uses the in-memory backend; `live` calls the real API |
| `NEXT_PUBLIC_API_URL` | URL | Backend base URL, used when mode is `live` |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` \| `public` | Network the guarantor's wallet must be on |

---

## Screens

| Route | Purpose |
|-------|---------|
| `/` | Connect a Stellar wallet; explains the model and the risk before sign-in |
| `/dashboard` | Collateral position, open loans, upcoming installments, loans at risk |
| `/loans` | Every loan the guarantor's collateral backs, filterable by status |
| `/loans/new` | Originate a loan, with a live quote of the collateral it costs |
| `/loans/[id]` | Repayment progress, installment schedule, partner attestations |
| `/beneficiaries` | Linked beneficiaries and their reputation scores |
| `/beneficiaries/[id]` | Reputation breakdown, loan history, remittance history |
| `/vault` | Deposit and withdraw USDC; collateral utilisation |
| `/remittances` | Remittance history — the cold-start credit signal |

---

## Architecture

```
app/
  page.tsx              Connect screen (unauthenticated)
  (app)/                Everything behind a connected wallet
    dashboard/ loans/ beneficiaries/ vault/ remittances/
components/
  providers/            Session context: challenge → sign → token
  ui/                   Design primitives (Card, StatTile, Badge, …)
lib/
  api/
    types.ts            The transport interface — one method per endpoint
    http.ts             Live implementation against NEXT_PUBLIC_API_URL
    mock/               In-memory backend: fixtures, protocol math, store
    quote.ts            Pre-origination loan quote, derived client-side
  stellar/freighter.ts  Wallet connection and challenge signing
  types.ts              Domain types mirroring the backend data model
```

### The data layer

Every screen imports a single `api` object. It resolves to one of two
implementations of the same `RemitCollateralApi` interface, chosen by
`NEXT_PUBLIC_API_MODE`:

- **`mock`** — an in-memory backend with seeded data and real protocol math:
  reputation scoring, LTV adjustment, schedule generation, and proportional
  collateral release. Mutations persist for the tab's lifetime, so originating a
  loan or recording a deposit is reflected everywhere. A reload resets it.
- **`live`** — `fetch` against the backend, with the session token attached as a
  bearer credential and `401` clearing the session.

Switching between them is one environment variable. No screen changes.

### Authentication

Wallet challenge-response, exactly as the backend defines it:

1. `connectWallet()` reads the public key from Freighter.
2. `GET /auth/challenge` returns a string to sign.
3. Freighter signs it — a message signature, not a transaction, so there is no fee.
4. `POST /auth/verify` exchanges the signature for a session token.

The token and guarantor profile are held in `localStorage`; `(app)/layout.tsx`
redirects to the connect screen without them.

### Trust model in the UI

The protocol's trust boundaries are visible rather than buried:

- Repayments show **who attested them** — only partner-signed attestations are
  accepted, never a claim from the beneficiary or the guarantor.
- Self-declared remittances are labelled as such and shown as weighted at zero.
- Remittance history below the six-month minimum is marked as not yet counting.
- Default risk appears on the origination screen **before** the loan is created,
  with the exact figure at stake.

---

## Repository boundaries

| Repository | Responsibility |
|------------|---------------|
| `remitcollateral-frontend` (this repo) | Guarantor dashboard (Next.js) |
| `remitcollateral-backend` | API server, business logic, database, off-ramp adapter, reputation engine |
| `remitcollateral-contracts` | Soroban contracts (GuarantorVault, LoanLedger, LiquidationEngine) |
| `remitcollateral-docs` | Protocol documentation and integration guides |

## Stack

Next.js 14 (App Router) · React 18 · TypeScript (strict) · Tailwind CSS · Freighter

## License

MIT — see [LICENSE](LICENSE).
