/**
 * Seed data for the mock backend.
 *
 * Dates are generated relative to load time so the dashboard always shows a
 * live-looking mix: one loan repaying on schedule, one in its grace period,
 * one already defaulted, and one beneficiary with no loan yet.
 */

import type {
  Beneficiary,
  Guarantor,
  Loan,
  RemittanceRecord,
  RepaymentAttestation,
  Vault,
} from '@/lib/types';
import {
  addDays,
  buildSchedule,
  compositeScore,
  localToUsd,
  ltvForScore,
  round2,
} from './protocol';

const NOW = new Date();

export const MOCK_WALLET =
  'GBXK7ZCMLQ4XR2PDTV3M6HSNAWQ2VJLKZ5YQF7TG3WNXHRBUE4C2MOCK';

export const guarantor: Guarantor = {
  id: 'g-0001',
  wallet_address: MOCK_WALLET,
  display_name: 'Adaeze Nwosu',
  created_at: addDays(NOW, -420).toISOString(),
};

export const beneficiaries: Beneficiary[] = [
  {
    id: 'b-0001',
    phone_number: '+2348031234567',
    local_kyc_ref: 'PARTNER-NG-88213',
    reputation_score: compositeScore({
      remittance_score: 0.88,
      repayment_score: 0.95,
      remittance_months_observed: 26,
    }),
    display_name: 'Amaka Obi',
    local_currency: 'NGN',
    created_at: addDays(NOW, -400).toISOString(),
  },
  {
    id: 'b-0002',
    phone_number: '+233201987654',
    local_kyc_ref: 'PARTNER-GH-40117',
    reputation_score: compositeScore({
      remittance_score: 0.62,
      repayment_score: 0.55,
      remittance_months_observed: 14,
    }),
    display_name: 'Kwame Mensah',
    local_currency: 'GHS',
    created_at: addDays(NOW, -260).toISOString(),
  },
  {
    id: 'b-0003',
    phone_number: '+221771122334',
    local_kyc_ref: 'PARTNER-SN-20904',
    reputation_score: compositeScore({
      remittance_score: 0.41,
      repayment_score: 0,
      remittance_months_observed: 3,
    }),
    display_name: 'Fatima Diallo',
    local_currency: 'XOF',
    created_at: addDays(NOW, -95).toISOString(),
  },
  {
    id: 'b-0004',
    phone_number: '+254712445566',
    local_kyc_ref: 'PARTNER-KE-71330',
    reputation_score: compositeScore({
      remittance_score: 0.55,
      repayment_score: 0.18,
      remittance_months_observed: 19,
    }),
    display_name: 'Joseph Otieno',
    local_currency: 'KES',
    created_at: addDays(NOW, -330).toISOString(),
  },
];

export const vault: Vault = {
  id: 'v-0001',
  guarantor_id: guarantor.id,
  collateral_balance: 14_500,
  // Recomputed from the seeded loans on store initialisation.
  locked_amount: 0,
  created_at: guarantor.created_at,
};

/** Builds a seeded loan with its schedule, marking the first `paidCount` installments paid. */
function seedLoan(args: {
  id: string;
  beneficiaryId: string;
  principalLocal: number;
  currency: string;
  installments: number;
  intervalDays: number;
  startedDaysAgo: number;
  paidCount: number;
  status: Loan['status'];
  score: number;
  purpose: string;
  graceExpiresInDays?: number;
}): Loan {
  const startedAt = addDays(NOW, -args.startedDaysAgo);
  const schedule = buildSchedule(
    args.principalLocal,
    args.installments,
    args.intervalDays,
    startedAt,
  ).map((entry, i) =>
    i < args.paidCount
      ? {
          ...entry,
          // Paid a day or two before the due date.
          paid_at: addDays(new Date(entry.due_at), -1).toISOString(),
          status: 'paid' as const,
        }
      : entry,
  );

  return {
    id: args.id,
    vault_id: vault.id,
    beneficiary_id: args.beneficiaryId,
    principal_local: args.principalLocal,
    principal_usd: localToUsd(args.principalLocal, args.currency),
    local_currency: args.currency,
    ltv_ratio: ltvForScore(args.score),
    installment_count: args.installments,
    schedule,
    status: args.status,
    grace_expires_at:
      args.graceExpiresInDays === undefined
        ? null
        : addDays(NOW, args.graceExpiresInDays).toISOString(),
    purpose: args.purpose,
    created_at: startedAt.toISOString(),
    updated_at: NOW.toISOString(),
  };
}

export const loans: Loan[] = [
  // Repaying on schedule — three of six installments cleared.
  seedLoan({
    id: 'l-0001',
    beneficiaryId: 'b-0001',
    principalLocal: 1_200_000,
    currency: 'NGN',
    installments: 6,
    intervalDays: 30,
    startedDaysAgo: 100,
    paidCount: 3,
    status: 'active',
    score: beneficiaries[0].reputation_score,
    purpose: 'Restocking inventory for the shop in Yaba',
  }),
  // Missed an installment; grace period still running.
  seedLoan({
    id: 'l-0002',
    beneficiaryId: 'b-0002',
    principalLocal: 9_500,
    currency: 'GHS',
    installments: 4,
    intervalDays: 30,
    startedDaysAgo: 95,
    paidCount: 2,
    status: 'grace',
    score: beneficiaries[1].reputation_score,
    purpose: 'School fees for the academic year',
    graceExpiresInDays: 3,
  }),
  // Fully repaid — collateral returned including the safety buffer.
  seedLoan({
    id: 'l-0003',
    beneficiaryId: 'b-0001',
    principalLocal: 450_000,
    currency: 'NGN',
    installments: 3,
    intervalDays: 30,
    startedDaysAgo: 300,
    paidCount: 3,
    status: 'repaid',
    score: 0.6,
    purpose: 'Generator repair',
  }),
  // Defaulted — collateral forfeited on the outstanding balance.
  seedLoan({
    id: 'l-0004',
    beneficiaryId: 'b-0004',
    principalLocal: 180_000,
    currency: 'KES',
    installments: 4,
    intervalDays: 30,
    startedDaysAgo: 220,
    paidCount: 1,
    status: 'defaulted',
    score: 0.5,
    purpose: 'Motorbike deposit',
  }),
];

/** One attestation per installment already marked paid. */
export const attestations: RepaymentAttestation[] = loans.flatMap((loan) =>
  loan.schedule
    .filter((entry) => entry.paid_at)
    .map((entry) => ({
      id: `a-${loan.id}-${entry.installment}`,
      loan_id: loan.id,
      installment_number: entry.installment,
      amount_local: entry.amount_local,
      amount_usd: localToUsd(entry.amount_local, loan.local_currency),
      attested_by: 'mock-offramp-partner',
      attested_at: entry.paid_at as string,
      created_at: entry.paid_at as string,
    })),
);

/** Monthly remittance history — the cold-start signal behind each score. */
function seedRemittances(
  beneficiaryId: string,
  months: number,
  amountUsd: number,
  currency: string,
  source: RemittanceRecord['source'] = 'partner_reported',
): RemittanceRecord[] {
  return Array.from({ length: months }, (_, i) => {
    const sentAt = addDays(NOW, -30 * (i + 1));
    // Small deterministic variation so the consistency signal is not artificially perfect.
    const jitter = 1 + ((i % 3) - 1) * 0.04;
    const usd = round2(amountUsd * jitter);
    return {
      id: `r-${beneficiaryId}-${i}`,
      guarantor_id: guarantor.id,
      beneficiary_id: beneficiaryId,
      amount_usd: usd,
      local_amount: Math.round(usd * (currency === 'NGN' ? 1580 : currency === 'GHS' ? 15.4 : currency === 'XOF' ? 608 : 129)),
      local_currency: currency,
      source,
      sent_at: sentAt.toISOString(),
      created_at: sentAt.toISOString(),
    };
  });
}

export const remittances: RemittanceRecord[] = [
  ...seedRemittances('b-0001', 26, 320, 'NGN'),
  ...seedRemittances('b-0002', 14, 180, 'GHS'),
  ...seedRemittances('b-0003', 3, 140, 'XOF', 'self_declared'),
  ...seedRemittances('b-0004', 19, 210, 'KES'),
];
