/**
 * Builds the pre-origination quote the guarantor sees before committing.
 *
 * It composes the beneficiary's reputation, the vault balance and the
 * off-ramp partner's exchange rate, all fetched from the API, so the preview
 * prices the loan at the same rate the backend will use to originate it. It
 * works identically against mock and live.
 */

import { PROTOCOL } from '@/lib/config';
import type { CreateLoanInput, LoanQuote } from '@/lib/types';
import { buildSchedule } from './mock/protocol';
import type { RemitCollateralApi } from './types';

export async function buildLoanQuote(
  api: RemitCollateralApi,
  input: CreateLoanInput,
): Promise<LoanQuote> {
  const [reputation, vault, rate] = await Promise.all([
    api.getReputation(input.beneficiary_id),
    api.getVault(),
    api.getExchangeRate(input.local_currency),
  ]);

  const principalUsd = Math.round((input.principal_local / rate.local_per_usd) * 100) / 100;
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
