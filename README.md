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

In `live` mode the dashboard also asks the backend whether it is connected to the
Soroban contracts (`GET /chain`). When it is, collateral moves only with the
guarantor's wallet signature — see [Wallet signing](#wallet-signing).

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
    quote.ts            Pre-origination loan quote, priced at the partner's exchange rate
  stellar/freighter.ts  Wallet connection, sign-in signing and transaction signing
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
  Exchange rates are fixed indicative figures for NGN, GHS, XOF, KES and USD.
- **`live`** — `fetch` against the backend, with the session token attached as a
  bearer credential and `401` clearing the session. Beneficiaries come from
  `GET /beneficiaries`, and loan quotes use the off-ramp partner's rate from
  `GET /fx/rates/:currency`, so the collateral a quote shows is the collateral the
  backend will lock.

Switching between them is one environment variable. No screen changes.

### Authentication

Wallet challenge-response, exactly as the backend defines it:

1. `connectWallet()` reads the public key from Freighter.
2. `GET /auth/challenge` returns a message naming the service, the wallet, a
   one-time nonce and an expiry.
3. Freighter signs it with `signMessage` (SEP-53) — a message signature, not a
   transaction, so there is no fee.
4. `POST /auth/verify` exchanges the signature for a session token.

The token and guarantor profile are held in `localStorage`; `(app)/layout.tsx`
redirects to the connect screen without them.

### Wallet signing

When the backend is connected to the contracts, a deposit, a withdrawal or a new
loan is a Stellar transaction the guarantor must sign: the vault and ledger
contracts accept nothing else. The live API does this inside the same
`depositCollateral`, `withdrawCollateral` and `createLoan` calls the pages already
use, so no screen knows the difference:

1. `POST …/prepare` — the backend builds the transaction, and refuses up front
   anything the contracts would reject, such as withdrawing locked collateral.
2. Freighter's `signTransaction` signs it as the signed-in account. Unlike
   sign-in, this is a real transaction with a small network fee.
3. `POST …/submit` — the backend submits it, accepting only the exact
   transaction it prepared.

Without the contracts connected, the same calls go to the backend's direct
endpoints and nothing is signed. In mock mode there is no wallet prompt at all.

### Trust model in the UI

The protocol's trust boundaries are visible rather than buried:

- Repayments show **who attested them** — only partner-signed attestations are
  accepted, never a claim from the beneficiary or the guarantor.
- Self-declared remittances are labelled as such and shown as weighted at zero.
- Remittance history below the six-month minimum is marked as not yet counting.
- Default risk appears on the origination screen **before** the loan is created,
  with the exact figure at stake.
- A beneficiary's partner **KYC reference is required**: it is how the partner
  identifies them, and what links two guarantors supporting the same person.

---

## Repository boundaries

| Repository | Responsibility |
|------------|---------------|
| `remitcollateral-frontend` (this repo) | Guarantor dashboard (Next.js) |
| `remitcollateral-backend` | API server, business logic, database, off-ramp adapter, reputation engine |
| `remitcollateral-contract` | Soroban contracts (GuarantorVault, LoanLedger, LiquidationEngine) |
| `remitcollateral-docs` | Protocol documentation and integration guides |

## Stack

Next.js 14 (App Router) · React 18 · TypeScript (strict) · Tailwind CSS · Freighter

## License

MIT — see [LICENSE](LICENSE).
