/** Runtime configuration, read once from the public env vars. */

export type ApiMode = 'mock' | 'live';

export const API_MODE: ApiMode =
  process.env.NEXT_PUBLIC_API_MODE === 'live' ? 'live' : 'mock';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const STELLAR_NETWORK =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'testnet';

/**
 * Protocol constants the dashboard displays. The backend is authoritative —
 * these mirror its defaults so the UI can explain a figure before an API
 * round trip, and every rendered number still comes from the API response.
 */
export const PROTOCOL = {
  /** Default LTV for a beneficiary with no reputation. */
  baseLtv: 1.5,
  /** Floor — the required LTV never drops below this. */
  minLtv: 1.1,
  /** Share of collateral retained until the final installment clears. */
  safetyBuffer: 0.05,
  /** Days after a missed installment before the loan can default. */
  gracePeriodDays: 7,
  /** Months of remittance history before it influences LTV. */
  minRemittanceMonths: 6,
  /** v1 scoring weights. */
  weights: { remittance: 0.4, repayment: 0.6 },
} as const;
