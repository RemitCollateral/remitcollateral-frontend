'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { LoanStatusBadge } from '@/components/LoanStatusBadge';
import { ScheduleTable } from '@/components/ScheduleTable';
import { ReputationMeter } from '@/components/ReputationMeter';
import {
  Badge,
  Card,
  CardHeader,
  ErrorNotice,
  ProgressBar,
  Skeleton,
  StatTile,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks/useAsync';
import { PROTOCOL } from '@/lib/config';
import {
  formatDate,
  formatLocal,
  formatRatio,
  formatRelativeDays,
  formatUsd,
  maskPhone,
} from '@/lib/format';

export default function LoanDetailPage({ params }: { params: { id: string } }) {
  const loanState = useAsync(() => api.getLoan(params.id), [params.id]);
  const repaymentState = useAsync(() => api.getRepayments(params.id), [params.id]);

  if (loanState.loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (loanState.error) {
    return <ErrorNotice message={loanState.error} onRetry={loanState.reload} />;
  }

  const loan = loanState.data;
  if (!loan) return null;

  const repaidRatio =
    loan.principal_local > 0 ? loan.total_repaid_local / loan.principal_local : 0;
  const requiredCollateral = loan.collateral_locked_usd + loan.collateral_released_usd;
  const beneficiaryName = loan.beneficiary.display_name ?? loan.beneficiary.phone_number;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Loan to ${beneficiaryName}`}
        description={loan.purpose ?? undefined}
        action={<LoanStatusBadge status={loan.status} />}
      />

      {loan.status === 'grace' && loan.grace_expires_at && (
        <div className="rounded-xl border border-warn/30 bg-warn-soft p-5">
          <h2 className="text-sm font-semibold text-warn">Grace period running</h2>
          <p className="mt-1 text-sm text-warn/90">
            An installment was missed. If payment is not attested by{' '}
            {formatDate(loan.grace_expires_at)} ({formatRelativeDays(loan.grace_expires_at)}),
            this loan defaults and {formatUsd(loan.collateral_locked_usd)} of your collateral
            is forfeited.
          </p>
        </div>
      )}

      {loan.status === 'defaulted' && (
        <div className="rounded-xl border border-bad/30 bg-bad-soft p-5">
          <h2 className="text-sm font-semibold text-bad">Collateral forfeited</h2>
          <p className="mt-1 text-sm text-bad/90">
            This loan defaulted with {formatLocal(loan.outstanding_local, loan.local_currency)}{' '}
            outstanding. The corresponding collateral was marked for liquidation and is not
            recoverable.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Principal"
          value={formatLocal(loan.principal_local, loan.local_currency)}
          hint={`${formatUsd(loan.principal_usd)} at origination`}
        />
        <StatTile
          label="Repaid"
          value={formatLocal(loan.total_repaid_local, loan.local_currency)}
          hint={`${Math.round(repaidRatio * 100)}% of principal`}
          tone="good"
        />
        <StatTile
          label="Collateral locked"
          value={formatUsd(loan.collateral_locked_usd)}
          hint={`${formatRatio(loan.ltv_ratio)} LTV on ${formatUsd(requiredCollateral)}`}
          tone={loan.collateral_locked_usd > 0 ? 'warn' : 'neutral'}
        />
        <StatTile
          label="Collateral released"
          value={formatUsd(loan.collateral_released_usd)}
          hint={
            loan.status === 'repaid'
              ? 'Fully returned, including the safety buffer'
              : `${formatRatio(PROTOCOL.safetyBuffer)} buffer held until fully repaid`
          }
          tone="good"
        />
      </div>

      <Card>
        <CardHeader
          title="Repayment progress"
          description={`${formatLocal(loan.outstanding_local, loan.local_currency)} outstanding across ${loan.installment_count} installments`}
        />
        <ProgressBar
          value={repaidRatio}
          tone={loan.status === 'defaulted' ? 'bad' : loan.status === 'grace' ? 'warn' : 'good'}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Installment schedule"
            description="Repayments are collected by the off-ramp partner and confirmed by signed attestation."
          />
          <ScheduleTable schedule={loan.schedule} currency={loan.local_currency} />
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Beneficiary" />
            <p className="font-medium text-ink">{beneficiaryName}</p>
            <p className="mt-0.5 font-mono text-sm text-ink-muted">
              {maskPhone(loan.beneficiary.phone_number)}
            </p>
            {loan.beneficiary.local_kyc_ref && (
              <p className="mt-2 text-xs text-ink-muted">
                KYC reference (held by the off-ramp partner):{' '}
                <span className="font-mono">{loan.beneficiary.local_kyc_ref}</span>
              </p>
            )}
            <div className="mt-4">
              <ReputationMeter score={loan.beneficiary.reputation_score} />
            </div>
            <Link
              href={`/beneficiaries/${loan.beneficiary.id}`}
              className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
            >
              View reputation breakdown
            </Link>
          </Card>

          <Card>
            <CardHeader
              title="Attestations"
              description="Signed confirmations from the off-ramp partner."
            />
            {repaymentState.loading && <Skeleton className="h-16" />}
            {repaymentState.error && <ErrorNotice message={repaymentState.error} />}
            {repaymentState.data?.length === 0 && (
              <p className="text-sm text-ink-muted">No repayments attested yet.</p>
            )}
            <ul className="divide-y divide-surface-border">
              {repaymentState.data?.map((attestation) => (
                <li key={attestation.id} className="py-3 first:pt-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-ink">
                      Installment {attestation.installment_number}
                    </span>
                    <span className="font-mono text-sm tabular-nums text-ink">
                      {formatLocal(attestation.amount_local, loan.local_currency)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatDate(attestation.attested_at)} · attested by{' '}
                    <span className="font-mono">{attestation.attested_by}</span>
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-surface-border pt-3">
              <Badge tone="neutral">Partner-signed</Badge>
              <p className="mt-2 text-xs text-ink-muted">
                The protocol accepts only partner-signed attestations — never a claim from the
                beneficiary or from you.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
