import Link from 'next/link';
import { Badge, ProgressBar } from '@/components/ui';
import { LoanStatusBadge } from '@/components/LoanStatusBadge';
import { formatLocal, formatRatio, formatRelativeDays, formatUsd } from '@/lib/format';
import type { LoanWithBeneficiary } from '@/lib/types';

export function LoanCard({ loan }: { loan: LoanWithBeneficiary }) {
  const repaidRatio =
    loan.principal_local > 0 ? loan.total_repaid_local / loan.principal_local : 0;
  const tone = loan.status === 'defaulted' ? 'bad' : loan.status === 'grace' ? 'warn' : 'good';

  return (
    <Link
      href={`/loans/${loan.id}`}
      className="block rounded-xl border border-surface-border bg-surface p-5 transition-colors hover:border-brand/40 hover:bg-brand-soft/30"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">
            {loan.beneficiary.display_name ?? loan.beneficiary.phone_number}
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {formatLocal(loan.principal_local, loan.local_currency)} ·{' '}
            {formatRatio(loan.ltv_ratio)} LTV
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loan.missed_installments > 0 && loan.status !== 'defaulted' && (
            <Badge tone="bad">
              {loan.missed_installments} missed
            </Badge>
          )}
          <LoanStatusBadge status={loan.status} />
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs text-ink-muted">
          <span>
            {formatLocal(loan.total_repaid_local, loan.local_currency)} repaid
          </span>
          <span>
            {formatLocal(loan.outstanding_local, loan.local_currency)} outstanding
          </span>
        </div>
        <ProgressBar value={repaidRatio} tone={tone} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-surface-border pt-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-ink-muted">Collateral locked</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-ink">
            {formatUsd(loan.collateral_locked_usd)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Released</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-ink">
            {formatUsd(loan.collateral_released_usd)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Next installment</dt>
          <dd className="mt-0.5 text-ink">
            {loan.next_installment
              ? formatRelativeDays(loan.next_installment.due_at)
              : '—'}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
