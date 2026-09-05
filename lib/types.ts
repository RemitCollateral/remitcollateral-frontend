/**
 * Domain types mirroring the RemitCollateral backend data model and API surface.
 * Field names match the backend's snake_case JSON so responses need no remapping.
 */

export type UUID = string;
/** ISO 8601 timestamp. */
export type Timestamp = string;
/** ISO 4217 currency code, e.g. "NGN". */
export type CurrencyCode = string;

export type LoanStatus = 'active' | 'grace' | 'repaid' | 'defaulted';
export type RemittanceSource = 'partner_reported' | 'self_declared';

export interface Guarantor {
  id: UUID;
  wallet_address: string;
  display_name: string | null;
  created_at: Timestamp;
}

export interface Vault {
  id: UUID;
  guarantor_id: UUID;
  /** Total USDC deposited. */
  collateral_balance: number;
  /** Portion backing active loans. */
  locked_amount: number;
  created_at: Timestamp;
}

/** Vault balance broken into the three figures the dashboard shows side by side. */
export interface VaultSummary extends Vault {
  available_amount: number;
}

export interface Beneficiary {
  id: UUID;
  phone_number: string;
  local_kyc_ref: string | null;
  /** Composite score, 0–1, combining remittance and repayment history. */
  reputation_score: number;
  display_name: string | null;
  local_currency: CurrencyCode;
  created_at: Timestamp;
}

/** The breakdown behind a composite score, per the backend's scoring weights. */
export interface ReputationBreakdown {
  beneficiary_id: UUID;
  composite_score: number;
  /** Weighted at 40% in v1. */
  remittance_score: number;
  /** Weighted at 60% in v1. */
  repayment_score: number;
  remittance_months_observed: number;
  /** Remittances only influence LTV after 6 months of history. */
  remittance_meets_minimum_history: boolean;
  on_time_repayment_rate: number;
  loans_completed: number;
  loans_defaulted: number;
  /** LTV this beneficiary currently qualifies for, as a ratio (1.5 = 150%). */
  qualified_ltv: number;
}

export interface ScheduleEntry {
  installment: number;
  amount_local: number;
  due_at: Timestamp;
  /** Present once an attestation has covered this installment. */
  paid_at: Timestamp | null;
  status: 'paid' | 'due' | 'upcoming' | 'overdue';
}

export interface Loan {
  id: UUID;
  vault_id: UUID;
  beneficiary_id: UUID;
  principal_local: number;
  /** USDC equivalent at origination. */
  principal_usd: number;
  local_currency: CurrencyCode;
  /** Computed at origination from the beneficiary's reputation. 1.5 = 150%. */
  ltv_ratio: number;
  installment_count: number;
  schedule: ScheduleEntry[];
  status: LoanStatus;
  /** Set when the loan enters the grace period. */
  grace_expires_at: Timestamp | null;
  purpose: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/** A loan joined with the display data the dashboard needs alongside it. */
export interface LoanWithBeneficiary extends Loan {
  beneficiary: Beneficiary;
  total_repaid_local: number;
  outstanding_local: number;
  collateral_locked_usd: number;
  collateral_released_usd: number;
  next_installment: ScheduleEntry | null;
  missed_installments: number;
}

export interface RepaymentAttestation {
  id: UUID;
  loan_id: UUID;
  installment_number: number;
  amount_local: number;
  amount_usd: number;
  /** Off-ramp partner identifier. */
  attested_by: string;
  attested_at: Timestamp;
  created_at: Timestamp;
}

export interface RemittanceRecord {
  id: UUID;
  guarantor_id: UUID;
  beneficiary_id: UUID;
  amount_usd: number;
  local_amount: number;
  local_currency: CurrencyCode;
  source: RemittanceSource;
  sent_at: Timestamp;
  created_at: Timestamp;
}

/** Payload for POST /loans. */
export interface CreateLoanInput {
  beneficiary_id: UUID;
  principal_local: number;
  local_currency: CurrencyCode;
  installment_count: number;
  installment_interval_days: number;
  purpose?: string;
}

/** Payload for POST /beneficiaries. */
export interface CreateBeneficiaryInput {
  phone_number: string;
  local_kyc_ref?: string;
  display_name?: string;
  local_currency: CurrencyCode;
}

/** Payload for POST /remittances. */
export interface CreateRemittanceInput {
  beneficiary_id: UUID;
  amount_usd: number;
  local_amount: number;
  local_currency: CurrencyCode;
  sent_at: Timestamp;
  source: RemittanceSource;
}

/**
 * What a loan would cost the guarantor, computed before origination so the
 * risk is visible up front rather than buried in fine print.
 */
export interface LoanQuote {
  principal_local: number;
  principal_usd: number;
  local_currency: CurrencyCode;
  /** Ratio, e.g. 1.35 for 135%. */
  ltv_ratio: number;
  required_collateral_usd: number;
  available_collateral_usd: number;
  sufficient_collateral: boolean;
  /** Collateral held back until the final installment clears. */
  safety_buffer_usd: number;
  schedule: ScheduleEntry[];
}

export interface DashboardData {
  guarantor: Guarantor;
  vault: VaultSummary;
  loans: LoanWithBeneficiary[];
  /** Installments due across all active loans, soonest first. */
  upcoming_installments: Array<{
    loan_id: UUID;
    beneficiary_name: string;
    local_currency: CurrencyCode;
    entry: ScheduleEntry;
  }>;
  at_risk_loans: LoanWithBeneficiary[];
}

export interface AuthChallenge {
  wallet_address: string;
  challenge: string;
  expires_at: Timestamp;
}

export interface AuthSession {
  token: string;
  guarantor: Guarantor;
  expires_at: Timestamp;
}
