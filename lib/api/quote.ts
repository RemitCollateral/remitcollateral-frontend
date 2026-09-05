/**
 * Builds the pre-origination quote the guarantor sees before committing.
 *
 * This is derived, not fetched: it composes the beneficiary's reputation and
 * the vault balance, both of which the backend already exposes. Keeping it
 * client-side means the loan form can react as the guarantor types without a
 * round trip per keystroke — and it works identically against mock and live.
 */

import { PROTOCOL } from '@/lib/config';
import type { CreateLoanInput, LoanQuote } from '@/lib/types';
import { MOCK_FX_RATES } from './mock/protocol';
import { buildSchedule } from './mock/protocol';
import type { RemitCollateralApi } from './types';

/**
 * Converts local currency to USD. The backend prices the loan authoritatively
 * at origination; this indicative rate only drives the preview.
 */
function toUsd(amount: number, currency: string): number {
  const rate = MOCK_FX_RATES[currency] ?? 1;
  return Math.round((amount / rate) * 100) / 100;
}

export async function buildLoanQuote(
  api: RemitCollateralApi,
  input: CreateLoanInput,
): Promise<LoanQuote> {
  const [reputation, vault] = await Promise.all([
    api.getReputation(input.beneficiary_id),
    api.getVault(),
  ]);

  const principalUsd = toUsd(input.principal_local, input.local_currency);
  const requiredCollateral = Math.round(principalUsd * reputation.qualified_ltv * 100) / 100;

  return {
    principal_local: input.principal_local,
    principal_usd: principalUsd,
    local_currency: input.local_currency,
    ltv_ratio: reputation.qualified_ltv,
    required_collateral_usd: requiredCollateral,
    available_collateral_usd: vault.available_amount,
    sufficient_collateral: requiredCollateral <= vault.available_amount,
    safety_buffer_usd: Math.round(requiredCollateral * PROTOCOL.safetyBuffer * 100) / 100,
    schedule: buildSchedule(
      input.principal_local,
      input.installment_count,
      input.installment_interval_days,
      new Date(),
    ),
  };
}
