/**
 * Protocol math reproduced client-side for the mock backend.
 *
 * The real backend owns these calculations; the mock implements them faithfully
 * so the dashboard exercises realistic numbers, and so the loan preview screen
 * can show a quote before a loan exists.
 */

import { PROTOCOL } from '@/lib/config';
import type { ScheduleEntry, ReputationBreakdown } from '@/lib/types';

/** Indicative FX rates used only by the mock backend. */
export const MOCK_FX_RATES: Record<string, number> = {
  NGN: 1580,
  GHS: 15.4,
  XOF: 608,
  KES: 129,
  USD: 1,
};

export function localToUsd(amount: number, currency: string): number {
  const rate = MOCK_FX_RATES[currency] ?? 1;
  return round2(amount / rate);
}

export function usdToLocal(amount: number, currency: string): number {
  const rate = MOCK_FX_RATES[currency] ?? 1;
  return Math.round(amount * rate);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * adjusted_ltv = max(min_ltv, base_ltv - (reputation_score * ltv_reduction_factor))
 *
 * The reduction factor is sized so a perfect score reaches exactly the floor.
 */
export function ltvForScore(score: number): number {
  const reductionFactor = PROTOCOL.baseLtv - PROTOCOL.minLtv;
  const clamped = Math.min(Math.max(score, 0), 1);
  return round2(Math.max(PROTOCOL.minLtv, PROTOCOL.baseLtv - clamped * reductionFactor));
}

/**
 * Composite score from the v1 weights: remittance history 40%, repayment 60%.
 * Remittance history below the minimum duration contributes nothing.
 */
export function compositeScore(
  parts: Pick<
    ReputationBreakdown,
    'remittance_score' | 'repayment_score' | 'remittance_months_observed'
  >,
): number {
  const remittanceCounts =
    parts.remittance_months_observed >= PROTOCOL.minRemittanceMonths;
  const remittance = remittanceCounts ? parts.remittance_score : 0;
  return round2(
    remittance * PROTOCOL.weights.remittance +
      parts.repayment_score * PROTOCOL.weights.repayment,
  );
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Splits the principal evenly, pushing any rounding remainder into the last installment. */
export function buildSchedule(
  principalLocal: number,
  installmentCount: number,
  intervalDays: number,
  startedAt: Date,
): ScheduleEntry[] {
  const per = Math.floor(principalLocal / installmentCount);
  const remainder = principalLocal - per * installmentCount;

  return Array.from({ length: installmentCount }, (_, i) => ({
    installment: i + 1,
    amount_local: i === installmentCount - 1 ? per + remainder : per,
    due_at: addDays(startedAt, intervalDays * (i + 1)).toISOString(),
    paid_at: null,
    status: 'upcoming' as const,
  }));
}

/**
 * Marks each installment against the clock: anything past due without a payment
 * is overdue, the soonest unpaid future installment is "due".
 */
export function applyScheduleStatus(
  schedule: ScheduleEntry[],
  now: Date = new Date(),
): ScheduleEntry[] {
  let nextUnpaidSeen = false;

  return schedule.map((entry) => {
    if (entry.paid_at) return { ...entry, status: 'paid' as const };

    if (new Date(entry.due_at) < now) {
      return { ...entry, status: 'overdue' as const };
    }
    if (!nextUnpaidSeen) {
      nextUnpaidSeen = true;
      return { ...entry, status: 'due' as const };
    }
    return { ...entry, status: 'upcoming' as const };
  });
}

/**
 * released_ratio = (total_repaid / total_principal) * (1 - safety_buffer)
 *
 * The buffer is only released once the loan is fully repaid.
 */
export function releasedCollateral(
  requiredCollateralUsd: number,
  totalRepaidLocal: number,
  totalPrincipalLocal: number,
): number {
  if (totalPrincipalLocal <= 0) return 0;
  const repaidRatio = Math.min(totalRepaidLocal / totalPrincipalLocal, 1);
  if (repaidRatio >= 1) return round2(requiredCollateralUsd);
  return round2(requiredCollateralUsd * repaidRatio * (1 - PROTOCOL.safetyBuffer));
}
