/**
 * The transport interface. Every method maps to one documented `/api/v1`
 * endpoint, so the mock and HTTP implementations stay interchangeable.
 */

import type {
  AuthChallenge,
  AuthSession,
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
  ScheduleEntry,
  UUID,
  VaultSummary,
} from '@/lib/types';

export interface RemitCollateralApi {
  /** GET /auth/challenge */
  getChallenge(walletAddress: string): Promise<AuthChallenge>;
  /** POST /auth/verify */
  verifyChallenge(walletAddress: string, signature: string): Promise<AuthSession>;

  /** GET /guarantors/me */
  getMe(): Promise<Guarantor>;
  /** GET /guarantors/me/dashboard */
  getDashboard(): Promise<DashboardData>;

  /** GET /vaults/me */
  getVault(): Promise<VaultSummary>;
  /** POST /vaults/deposit */
  depositCollateral(amountUsd: number, txHash?: string): Promise<VaultSummary>;
  /** POST /vaults/withdraw */
  withdrawCollateral(amountUsd: number): Promise<VaultSummary>;

  /** Derived from the dashboard payload; the backend has no list endpoint in v1. */
  listBeneficiaries(): Promise<Beneficiary[]>;
  /** GET /beneficiaries/:id */
  getBeneficiary(id: UUID): Promise<Beneficiary>;
  /** POST /beneficiaries */
  createBeneficiary(input: CreateBeneficiaryInput): Promise<Beneficiary>;
  /** GET /beneficiaries/:id/reputation */
  getReputation(id: UUID): Promise<ReputationBreakdown>;

  /** GET /loans */
  listLoans(): Promise<LoanWithBeneficiary[]>;
  /** GET /loans/:id */
  getLoan(id: UUID): Promise<LoanWithBeneficiary>;
  /** GET /loans/:id/schedule */
  getLoanSchedule(id: UUID): Promise<ScheduleEntry[]>;
  /** POST /loans */
  createLoan(input: CreateLoanInput): Promise<Loan>;
  /** GET /loans/:id/repayments */
  getRepayments(loanId: UUID): Promise<RepaymentAttestation[]>;

  /** GET /remittances */
  listRemittances(): Promise<RemittanceRecord[]>;
  /** POST /remittances */
  createRemittance(input: CreateRemittanceInput): Promise<RemittanceRecord>;
}

/** Thrown for any non-2xx API response, and by the mock for equivalent failures. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
