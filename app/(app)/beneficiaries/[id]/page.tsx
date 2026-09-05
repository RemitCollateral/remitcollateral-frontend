'use client';

import { PageHeader } from '@/components/PageHeader';
import { ReputationMeter } from '@/components/ReputationMeter';
import { LoanCard } from '@/components/LoanCard';
import {
  Badge,
  Card,
  CardHeader,
  ErrorNotice,
  ProgressBar,
  Skeleton,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks/useAsync';
import { PROTOCOL } from '@/lib/config';
import { formatDate, formatRatio, formatScore, formatUsd, maskPhone } from '@/lib/format';

export default function BeneficiaryPage({ params }: { params: { id: string } }) {
  const beneficiary = useAsync(() => api.getBeneficiary(params.id), [params.id]);
  const reputation = useAsync(() => api.getReputation(params.id), [params.id]);
  const loans = useAsync(() => api.listLoans(), []);
  const remittances = useAsync(() => api.listRemittances(), []);

  if (beneficiary.loading || reputation.loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (beneficiary.error) {
    return <ErrorNotice message={beneficiary.error} onRetry={beneficiary.reload} />;
  }

  const person = beneficiary.data;
  const score = reputation.data;
  if (!person || !score) return null;

  const theirLoans = (loans.data ?? []).filter((l) => l.beneficiary_id === person.id);
  const theirRemittances = (remittances.data ?? []).filter(
    (r) => r.beneficiary_id === person.id,
  );
  const trusted = theirRemittances.filter((r) => r.source === 'partner_reported');
  const totalSentUsd = trusted.reduce((sum, r) => sum + r.amount_usd, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={person.display_name ?? person.phone_number}
        description={`${maskPhone(person.phone_number)} · ${person.local_currency} · linked since ${formatDate(person.created_at)}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Composite score" />
          <ReputationMeter score={score.composite_score} ltv={score.qualified_ltv} />
          <p className="mt-4 text-xs text-ink-muted">
            A {formatRatio(PROTOCOL.baseLtv)} base LTV falls toward the{' '}
            {formatRatio(PROTOCOL.minLtv)} floor as this score rises. The score is computed
            from records, never from anyone&apos;s assertion.
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="How the score is built"
            description="Repayment history carries the most weight; remittance history is the cold-start signal."
          />

          <div className="space-y-5">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-sm font-medium text-ink">
                  Repayment history
                  <span className="ml-2 text-xs text-ink-muted">
                    {formatRatio(PROTOCOL.weights.repayment)} weight
                  </span>
                </span>
                <span className="font-mono text-sm tabular-nums text-ink">
                  {formatScore(score.repayment_score)}
                </span>
              </div>
              <ProgressBar value={score.repayment_score} tone="brand" />
              <p className="mt-1.5 text-xs text-ink-muted">
                {Math.round(score.on_time_repayment_rate * 100)}% of installments paid on time ·{' '}
                {score.loans_completed} loan{score.loans_completed === 1 ? '' : 's'} repaid ·{' '}
                {score.loans_defaulted} defaulted
              </p>
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-sm font-medium text-ink">
                  Remittance consistency
                  <span className="ml-2 text-xs text-ink-muted">
                    {formatRatio(PROTOCOL.weights.remittance)} weight
                  </span>
                </span>
                <span className="font-mono text-sm tabular-nums text-ink">
                  {formatScore(score.remittance_score)}
                </span>
              </div>
              <ProgressBar
                value={score.remittance_score}
                tone={score.remittance_meets_minimum_history ? 'brand' : 'warn'}
              />
              <p className="mt-1.5 text-xs text-ink-muted">
                {score.remittance_months_observed} months of partner-reported history
                {score.remittance_meets_minimum_history ? (
                  <> · counted toward the score</>
                ) : (
                  <>
                    {' '}
                    · below the {PROTOCOL.minRemittanceMonths}-month minimum, so it does not
                    yet affect LTV
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-surface-border pt-4">
            <Badge tone="neutral">Self-declared records weighted at 0</Badge>
            <p className="mt-2 text-xs text-ink-muted">
              Only partner-reported remittances count in v1. Self-declared history is stored
              but not trusted until it can be verified.
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <CardHeader title="Loans" />
          {theirLoans.length === 0 ? (
            <p className="text-sm text-ink-muted">No loans originated for this beneficiary yet.</p>
          ) : (
            theirLoans.map((loan) => <LoanCard key={loan.id} loan={loan} />)
          )}
        </div>

        <Card className="h-fit">
          <CardHeader
            title="Remittance history"
            description={`${formatUsd(totalSentUsd)} sent across ${trusted.length} partner-reported transfers.`}
          />
          {theirRemittances.length === 0 ? (
            <p className="text-sm text-ink-muted">No remittances recorded.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-surface-border overflow-y-auto">
              {theirRemittances.slice(0, 24).map((record) => (
                <li key={record.id} className="flex items-baseline justify-between gap-3 py-2.5">
                  <div>
                    <p className="font-mono text-sm tabular-nums text-ink">
                      {formatUsd(record.amount_usd)}
                    </p>
                    <p className="text-xs text-ink-muted">{formatDate(record.sent_at)}</p>
                  </div>
                  <Badge tone={record.source === 'partner_reported' ? 'good' : 'neutral'}>
                    {record.source === 'partner_reported' ? 'Partner' : 'Self-declared'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
