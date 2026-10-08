'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { LoanCard } from '@/components/LoanCard';
import { RiskNotice } from '@/components/RiskNotice';
import {
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  ErrorNotice,
  Skeleton,
  StatTile,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks/useAsync';
import { formatLocal, formatRelativeDays, formatUsd } from '@/lib/format';

export default function DashboardPage() {
  const { data, loading, error, reload } = useAsync(() => api.getDashboard());

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) return <ErrorNotice message={error} onRetry={reload} />;
  if (!data) return null;

  const { vault, loans, upcoming_installments: upcoming, at_risk_loans: atRisk } = data;
  const openLoans = loans.filter((l) => l.status === 'active' || l.status === 'grace');

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${data.guarantor.display_name ?? 'guarantor'}`}
        description="Your collateral, the loans it backs, and what is due next."
        action={<ButtonLink href="/loans/new">Originate a loan</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Collateral deposited"
          value={formatUsd(vault.collateral_balance)}
          hint="Total USDC in your vault"
        />
        <StatTile
          label="Locked"
          value={formatUsd(vault.locked_amount)}
          hint={`Backing ${openLoans.length} open loan${openLoans.length === 1 ? '' : 's'}`}
          tone={vault.locked_amount > 0 ? 'warn' : 'neutral'}
        />
        <StatTile
          label="Available"
          value={formatUsd(vault.available_amount)}
          hint="Free to lend against or withdraw"
          tone="good"
        />
      </div>

      {/* Portfolio Health & Collateral Utilization Gauge */}
      {(() => {
        const utilizationPct =
          vault.collateral_balance > 0
            ? Math.min(100, Math.round((vault.locked_amount / vault.collateral_balance) * 100))
            : 0;

        const isHighUtilization = utilizationPct >= 85;
        const healthScore =
          atRisk.length > 0
            ? 'At Risk'
            : isHighUtilization
            ? 'Moderate'
            : 'Healthy';

        const healthTone =
          atRisk.length > 0 ? 'bad' : isHighUtilization ? 'warn' : 'good';

        return (
          <Card className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-ink">Portfolio Health & Utilization</h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      healthTone === 'good'
                        ? 'bg-good-soft text-good'
                        : healthTone === 'warn'
                        ? 'bg-warn-soft text-warn'
                        : 'bg-bad-soft text-bad'
                    }`}
                  >
                    {healthScore}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  {utilizationPct}% of total collateral locked behind active loans
                  {atRisk.length > 0 && ` · ${atRisk.length} loan(s) require attention`}
                </p>
              </div>

              {isHighUtilization && (
                <ButtonLink href="/vault" variant="secondary" size="sm">
                  Deposit USDC Buffer
                </ButtonLink>
              )}
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs font-medium text-ink-muted mb-1.5">
                <span>Utilization Rate</span>
                <span className="font-mono">{utilizationPct}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-subtle border border-surface-border">
                <div
                  className={`h-full transition-all duration-300 ${
                    utilizationPct >= 90
                      ? 'bg-bad'
                      : utilizationPct >= 75
                      ? 'bg-warn'
                      : 'bg-brand'
                  }`}
                  style={{ width: `${utilizationPct}%` }}
                />
              </div>
            </div>
          </Card>
        );
      })()}

      {atRisk.length > 0 && <RiskNotice loans={atRisk} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <CardHeader
            title="Open loans"
            action={
              <Link href="/loans" className="text-sm font-medium text-brand hover:underline">
                View all
              </Link>
            }
          />
          {openLoans.length === 0 ? (
            <EmptyState
              title="No open loans"
              description="Once you originate a loan, its repayment progress and collateral status appear here."
              action={<ButtonLink href="/loans/new">Originate a loan</ButtonLink>}
            />
          ) : (
            <div className="space-y-4">
              {openLoans.map((loan) => (
                <LoanCard key={loan.id} loan={loan} />
              ))}
            </div>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader title="Upcoming installments" />
          {upcoming.length === 0 ? (
            <p className="text-sm text-ink-muted">Nothing scheduled.</p>
          ) : (
            <ul className="divide-y divide-surface-border">
              {upcoming.map((item) => (
                <li key={`${item.loan_id}-${item.entry.installment}`} className="py-3 first:pt-0">
                  <Link href={`/loans/${item.loan_id}`} className="block hover:opacity-80">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-ink">
                        {item.beneficiary_name}
                      </span>
                      <span className="font-mono text-sm tabular-nums text-ink">
                        {formatLocal(item.entry.amount_local, item.local_currency)}
                      </span>
                    </div>
                    <p
                      className={
                        item.entry.status === 'overdue'
                          ? 'mt-0.5 text-xs font-medium text-bad'
                          : 'mt-0.5 text-xs text-ink-muted'
                      }
                    >
                      Installment {item.entry.installment} ·{' '}
                      {item.entry.status === 'overdue' ? 'overdue ' : 'due '}
                      {formatRelativeDays(item.entry.due_at)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
