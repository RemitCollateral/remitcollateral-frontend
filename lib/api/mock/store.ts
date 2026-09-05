/**
 * In-memory mock backend.
 *
 * Holds mutable copies of the fixtures for the lifetime of the browser tab, so
 * originating a loan or recording a deposit is reflected across every screen
 * exactly as a real backend would. Reloading the page resets it.
 */

import type {
  Beneficiary,
  CreateBeneficiaryInput,
  CreateLoanInput,
  CreateRemittanceInput,
  DashboardData,
  Guarantor,
  Loan,
  LoanWithBeneficiary,
  RemittanceRecord,
  RepaymentAttestation,
  ReputationBreakdown,
  UUID,
  VaultSummary,
} from '@/lib/types';
import { PROTOCOL } from '@/lib/config';
import { ApiError } from '../types';
import {
  applyScheduleStatus,
  buildSchedule,
  compositeScore,
  localToUsd,
  ltvForScore,
  releasedCollateral,
  round2,
} from './protocol';
import * as fixtures from './fixtures';

interface MockState {
  guarantor: Guarantor;
  vault: { collateral_balance: number };
  beneficiaries: Beneficiary[];
  loans: Loan[];
  attestations: RepaymentAttestation[];
  remittances: RemittanceRecord[];
}

let state: MockState | null = null;

function init(): MockState {
  return {
    guarantor: { ...fixtures.guarantor },
    vault: { collateral_balance: fixtures.vault.collateral_balance },
    beneficiaries: fixtures.beneficiaries.map((b) => ({ ...b })),
    loans: fixtures.loans.map((l) => ({ ...l, schedule: l.schedule.map((s) => ({ ...s })) })),
    attestations: fixtures.attestations.map((a) => ({ ...a })),
    remittances: fixtures.remittances.map((r) => ({ ...r })),
  };
}

function db(): MockState {
  if (!state) state = init();
  return state;
}

/** Test/dev helper — drops all mutations and restores the seed data. */
export function resetMockStore(): void {
  state = null;
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}${idCounter}`;
}

// --- derivation ------------------------------------------------------------

/** Required collateral for a loan: principal in USD at the loan's LTV. */
function requiredCollateral(loan: Loan): number {
  return round2(loan.principal_usd * loan.ltv_ratio);
}

export function decorateLoan(loan: Loan, beneficiaries: Beneficiary[]): LoanWithBeneficiary {
  const beneficiary = beneficiaries.find((b) => b.id === loan.beneficiary_id);
  if (!beneficiary) {
    throw new ApiError(`Beneficiary ${loan.beneficiary_id} not found`, 404);
  }

  const schedule = applyScheduleStatus(loan.schedule);
  const totalRepaid = schedule
    .filter((e) => e.paid_at)
    .reduce((sum, e) => sum + e.amount_local, 0);

  const required = requiredCollateral(loan);
  // Collateral released before the loan settled. On default the remainder is
  // forfeited rather than returned, so nothing stays locked either way.
  const released = releasedCollateral(required, totalRepaid, loan.principal_local);
  const settled = loan.status === 'repaid' || loan.status === 'defaulted';

  return {
    ...loan,
    schedule,
    beneficiary,
    total_repaid_local: totalRepaid,
    outstanding_local: round2(loan.principal_local - totalRepaid),
    collateral_locked_usd: settled ? 0 : round2(required - released),
    collateral_released_usd: released,
    next_installment: schedule.find((e) => !e.paid_at) ?? null,
    missed_installments: schedule.filter((e) => e.status === 'overdue').length,
  };
}

/** Collateral still committed across every unsettled loan. */
function lockedAmount(loans: Loan[], beneficiaries: Beneficiary[]): number {
  return round2(
    loans
      .filter((l) => l.status === 'active' || l.status === 'grace')
      .reduce((sum, l) => sum + decorateLoan(l, beneficiaries).collateral_locked_usd, 0),
  );
}

function vaultSummary(): VaultSummary {
  const s = db();
  const locked = lockedAmount(s.loans, s.beneficiaries);
  return {
    id: fixtures.vault.id,
    guarantor_id: s.guarantor.id,
    collateral_balance: round2(s.vault.collateral_balance),
    locked_amount: locked,
    available_amount: round2(s.vault.collateral_balance - locked),
    created_at: fixtures.vault.created_at,
  };
}

/**
 * Recomputes a beneficiary's reputation from the underlying records, the way
 * the backend does on every attestation and remittance ingestion.
 */
function reputationFor(beneficiaryId: UUID): ReputationBreakdown {
  const s = db();
  const records = s.remittances.filter((r) => r.beneficiary_id === beneficiaryId);
  // self_declared records are weighted at 0.0 in v1 — they are not trusted yet.
  const trusted = records.filter((r) => r.source === 'partner_reported');

  const monthsObserved = trusted.length
    ? Math.round(
        (Date.now() -
          Math.min(...trusted.map((r) => new Date(r.sent_at).getTime()))) /
          (30 * 86_400_000),
      )
    : 0;

  const remittanceScore = trusted.length ? consistencyScore(trusted) : 0;

  const loans = s.loans.filter((l) => l.beneficiary_id === beneficiaryId);
  const allInstallments = loans.flatMap((l) => applyScheduleStatus(l.schedule));
  const dueOrPast = allInstallments.filter((e) => e.paid_at || e.status === 'overdue');
  const onTimeRate = dueOrPast.length
    ? round2(dueOrPast.filter((e) => e.paid_at).length / dueOrPast.length)
    : 0;

  const defaulted = loans.filter((l) => l.status === 'defaulted').length;
  // A default is a hard signal, not just a missed installment.
  const repaymentScore = round2(Math.max(0, onTimeRate - defaulted * 0.35));

  const composite = compositeScore({
    remittance_score: remittanceScore,
    repayment_score: repaymentScore,
    remittance_months_observed: monthsObserved,
  });

  return {
    beneficiary_id: beneficiaryId,
    composite_score: composite,
    remittance_score: remittanceScore,
    repayment_score: repaymentScore,
    remittance_months_observed: monthsObserved,
    remittance_meets_minimum_history: monthsObserved >= PROTOCOL.minRemittanceMonths,
    on_time_repayment_rate: onTimeRate,
    loans_completed: loans.filter((l) => l.status === 'repaid').length,
    loans_defaulted: defaulted,
    qualified_ltv: ltvForScore(composite),
  };
}

/**
 * Frequency, consistency and duration folded into one 0–1 signal:
 * how regular the amounts are, and how long the history runs.
 */
function consistencyScore(records: RemittanceRecord[]): number {
  const amounts = records.map((r) => r.amount_usd);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  if (mean === 0) return 0;

  const variance =
    amounts.reduce((sum, a) => sum + (a - mean) ** 2, 0) / amounts.length;
  const coefficientOfVariation = Math.sqrt(variance) / mean;
  const consistency = Math.max(0, 1 - coefficientOfVariation * 2);

  // 24 months of history saturates the duration component.
  const duration = Math.min(records.length / 24, 1);

  return round2(consistency * 0.6 + duration * 0.4);
}

/** Keeps the stored composite score in step with the records behind it. */
function refreshScore(beneficiaryId: UUID): void {
  const s = db();
  const beneficiary = s.beneficiaries.find((b) => b.id === beneficiaryId);
  if (beneficiary) {
    beneficiary.reputation_score = reputationFor(beneficiaryId).composite_score;
  }
}

// --- reads -----------------------------------------------------------------

export const mockStore = {
  guarantor: (): Guarantor => ({ ...db().guarantor }),

  vault: vaultSummary,

  beneficiaries: (): Beneficiary[] =>
    db().beneficiaries.map((b) => ({
      ...b,
      reputation_score: reputationFor(b.id).composite_score,
    })),

  beneficiary(id: UUID): Beneficiary {
    const found = this.beneficiaries().find((b) => b.id === id);
    if (!found) throw new ApiError('Beneficiary not found', 404);
    return found;
  },

  reputation: (id: UUID): ReputationBreakdown => {
    const s = db();
    if (!s.beneficiaries.some((b) => b.id === id)) {
      throw new ApiError('Beneficiary not found', 404);
    }
    return reputationFor(id);
  },

  loans(): LoanWithBeneficiary[] {
    const s = db();
    return s.loans
      .map((l) => decorateLoan(l, s.beneficiaries))
      .sort((a, b) => statusRank(a) - statusRank(b) || b.created_at.localeCompare(a.created_at));
  },

  loan(id: UUID): LoanWithBeneficiary {
    const found = this.loans().find((l) => l.id === id);
    if (!found) throw new ApiError('Loan not found', 404);
    return found;
  },

  repayments: (loanId: UUID): RepaymentAttestation[] =>
    db()
      .attestations.filter((a) => a.loan_id === loanId)
      .sort((a, b) => b.attested_at.localeCompare(a.attested_at)),

  remittances: (): RemittanceRecord[] =>
    db()
      .remittances.slice()
      .sort((a, b) => b.sent_at.localeCompare(a.sent_at)),

  dashboard(): DashboardData {
    const loans = this.loans();
    const active = loans.filter((l) => l.status === 'active' || l.status === 'grace');

    const upcoming = active
      .flatMap((loan) =>
        loan.schedule
          .filter((entry) => !entry.paid_at)
          .map((entry) => ({
            loan_id: loan.id,
            beneficiary_name: loan.beneficiary.display_name ?? loan.beneficiary.phone_number,
            local_currency: loan.local_currency,
            entry,
          })),
      )
      .sort((a, b) => a.entry.due_at.localeCompare(b.entry.due_at))
      .slice(0, 6);

    return {
      guarantor: this.guarantor(),
      vault: this.vault(),
      loans,
      upcoming_installments: upcoming,
      at_risk_loans: active.filter(
        (l) => l.status === 'grace' || l.missed_installments > 0,
      ),
    };
  },

  // --- writes --------------------------------------------------------------

  deposit(amountUsd: number): VaultSummary {
    if (amountUsd <= 0) throw new ApiError('Deposit must be greater than zero', 400);
    db().vault.collateral_balance = round2(db().vault.collateral_balance + amountUsd);
    return vaultSummary();
  },

  withdraw(amountUsd: number): VaultSummary {
    const summary = vaultSummary();
    if (amountUsd <= 0) throw new ApiError('Withdrawal must be greater than zero', 400);
    if (amountUsd > summary.available_amount) {
      throw new ApiError(
        `Only ${summary.available_amount} USDC is unlocked; the rest backs active loans`,
        400,
      );
    }
    db().vault.collateral_balance = round2(db().vault.collateral_balance - amountUsd);
    return vaultSummary();
  },

  createBeneficiary(input: CreateBeneficiaryInput): Beneficiary {
    const s = db();
    if (s.beneficiaries.some((b) => b.phone_number === input.phone_number)) {
      throw new ApiError('A beneficiary with this phone number already exists', 409);
    }
    const beneficiary: Beneficiary = {
      id: nextId('b'),
      phone_number: input.phone_number,
      local_kyc_ref: input.local_kyc_ref ?? null,
      display_name: input.display_name ?? null,
      local_currency: input.local_currency,
      reputation_score: 0,
      created_at: new Date().toISOString(),
    };
    s.beneficiaries.push(beneficiary);
    return { ...beneficiary };
  },

  createLoan(input: CreateLoanInput): Loan {
    const s = db();
    const beneficiary = s.beneficiaries.find((b) => b.id === input.beneficiary_id);
    if (!beneficiary) throw new ApiError('Beneficiary not found', 404);

    if (input.principal_local <= 0) {
      throw new ApiError('Principal must be greater than zero', 400);
    }
    if (input.installment_count < 1) {
      throw new ApiError('A loan needs at least one installment', 400);
    }

    // One loan per guarantor-beneficiary pair at a time.
    const openLoan = s.loans.find(
      (l) =>
        l.beneficiary_id === input.beneficiary_id &&
        (l.status === 'active' || l.status === 'grace'),
    );
    if (openLoan) {
      throw new ApiError(
        'This beneficiary already has an open loan. It must be repaid before another is originated.',
        409,
      );
    }

    const ltv = reputationFor(beneficiary.id).qualified_ltv;
    const principalUsd = localToUsd(input.principal_local, input.local_currency);
    const required = round2(principalUsd * ltv);
    const available = vaultSummary().available_amount;

    if (required > available) {
      throw new ApiError(
        `This loan needs ${required} USDC of collateral at ${Math.round(ltv * 100)}% LTV; only ${available} USDC is available`,
        400,
      );
    }

    const now = new Date();
    const loan: Loan = {
      id: nextId('l'),
      vault_id: fixtures.vault.id,
      beneficiary_id: beneficiary.id,
      principal_local: input.principal_local,
      principal_usd: principalUsd,
      local_currency: input.local_currency,
      ltv_ratio: ltv,
      installment_count: input.installment_count,
      schedule: buildSchedule(
        input.principal_local,
        input.installment_count,
        input.installment_interval_days,
        now,
      ),
      status: 'active',
      grace_expires_at: null,
      purpose: input.purpose ?? null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    s.loans.push(loan);
    return loan;
  },

  createRemittance(input: CreateRemittanceInput): RemittanceRecord {
    const s = db();
    if (!s.beneficiaries.some((b) => b.id === input.beneficiary_id)) {
      throw new ApiError('Beneficiary not found', 404);
    }
    const record: RemittanceRecord = {
      id: nextId('r'),
      guarantor_id: s.guarantor.id,
      ...input,
      created_at: new Date().toISOString(),
    };
    s.remittances.push(record);
    refreshScore(input.beneficiary_id);
    return { ...record };
  },
};

/** Sorts loans needing attention to the top of any list. */
function statusRank(loan: LoanWithBeneficiary): number {
  if (loan.status === 'grace') return 0;
  if (loan.status === 'active') return loan.missed_installments > 0 ? 1 : 2;
  if (loan.status === 'defaulted') return 3;
  return 4;
}
