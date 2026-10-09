/** Runtime configuration, read once from the public env vars. */

export type ApiMode = 'mock' | 'live';

/**
 * Decide the API mode, refusing to guess where guessing is dangerous.
 *
 * Unset used to mean "mock", silently. A deployment that forgot the variable
 * (or a Vercel target it was never set for) then served mock data, while still
 * prompting a real Freighter, and nothing said so. So a production build must
 * be told explicitly, and a value that is neither "mock" nor "live" (a typo
 * like "Live") is an error everywhere rather than quietly becoming mock.
 * Local development keeps the convenient default.
 */
export function resolveApiMode(raw: string | undefined, nodeEnv: string | undefined): ApiMode {
  if (raw === 'live' || raw === 'mock') return raw;

  if (raw !== undefined && raw !== '') {
    throw new Error(`NEXT_PUBLIC_API_MODE must be "mock" or "live", got "${raw}".`);
  }
  if (nodeEnv === 'production') {
    throw new Error(
      'NEXT_PUBLIC_API_MODE is not set. A production build must say "live" or "mock" ' +
        'explicitly; it will not default to mock data.',
    );
  }
  return 'mock';
}

/**
 * The backend URL. In live mode a production build must be given one: falling
 * back to localhost means every visitor's browser calls their own machine.
 */
export function resolveApiUrl(
  raw: string | undefined,
  mode: ApiMode,
  nodeEnv: string | undefined,
): string {
  if (raw) return raw;
  if (mode === 'live' && nodeEnv === 'production') {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not set. A live production build must name its backend; ' +
        'it will not default to localhost.',
    );
  }
  return 'http://localhost:4000/api/v1';
}

export const API_MODE: ApiMode = resolveApiMode(
  process.env.NEXT_PUBLIC_API_MODE,
  process.env.NODE_ENV,
);

export const API_URL = resolveApiUrl(process.env.NEXT_PUBLIC_API_URL, API_MODE, process.env.NODE_ENV);

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
