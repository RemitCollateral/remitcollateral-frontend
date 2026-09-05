import { formatUsd, formatRelativeDays } from '@/lib/format';
import type { LoanWithBeneficiary } from '@/lib/types';

/**
 * Default risk stated plainly. The architecture makes this a design
 * constraint: the guarantor sees what they stand to lose, not fine print.
 */
export function RiskNotice({ loans }: { loans: LoanWithBeneficiary[] }) {
  if (loans.length === 0) return null;

  const exposure = loans.reduce((sum, loan) => sum + loan.collateral_locked_usd, 0);

  return (
    <div className="rounded-xl border border-warn/30 bg-warn-soft p-5">
      <h2 className="text-sm font-semibold text-warn">
        {loans.length === 1 ? '1 loan needs attention' : `${loans.length} loans need attention`}
      </h2>
      <p className="mt-1 text-sm text-warn/90">
        {formatUsd(exposure)} of your collateral is at risk. If a grace period expires without
        payment, the outstanding portion is forfeited and cannot be recovered.
      </p>
      <ul className="mt-3 space-y-2">
        {loans.map((loan) => (
          <li key={loan.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="font-medium text-ink">
              {loan.beneficiary.display_name ?? loan.beneficiary.phone_number}
            </span>
            <span className="text-warn">
              {loan.grace_expires_at
                ? `Grace period ends ${formatRelativeDays(loan.grace_expires_at)}`
                : `${loan.missed_installments} missed installment${loan.missed_installments === 1 ? '' : 's'}`}
              {' · '}
              {formatUsd(loan.collateral_locked_usd)} exposed
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
