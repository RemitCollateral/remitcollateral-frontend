'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { LoanCard } from '@/components/LoanCard';
import { ButtonLink, EmptyState, ErrorNotice, Skeleton, cx } from '@/components/ui';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks/useAsync';
import type { LoanStatus } from '@/lib/types';

const filters: Array<{ value: LoanStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'grace', label: 'In grace' },
  { value: 'repaid', label: 'Repaid' },
  { value: 'defaulted', label: 'Defaulted' },
];

export default function LoansPage() {
  const { data, loading, error, reload } = useAsync(() => api.listLoans());
  const [filter, setFilter] = useState<LoanStatus | 'all'>('all');

  const loans = (data ?? []).filter((loan) => filter === 'all' || loan.status === filter);

  return (
    <div>
      <PageHeader
        title="Loans"
        description="Every loan your collateral backs, newest and most urgent first."
        action={<ButtonLink href="/loans/new">Originate a loan</ButtonLink>}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={cx(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              filter === option.value
                ? 'bg-ink text-white'
                : 'bg-surface text-ink-muted ring-1 ring-inset ring-surface-border hover:text-ink',
            )}
          >
            {option.label}
            {data && option.value !== 'all' && (
              <span className="ml-1.5 font-mono text-xs opacity-70">
                {data.filter((l) => l.status === option.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      )}

      {error && <ErrorNotice message={error} onRetry={reload} />}

      {data && loans.length === 0 && (
        <EmptyState
          title={filter === 'all' ? 'No loans yet' : `No ${filter} loans`}
          description={
            filter === 'all'
              ? 'Originate your first loan to put your collateral to work for someone back home.'
              : 'Try a different filter to see the rest of your loans.'
          }
          action={filter === 'all' ? <ButtonLink href="/loans/new">Originate a loan</ButtonLink> : undefined}
        />
      )}

      <div className="space-y-4">
        {loans.map((loan) => (
          <LoanCard key={loan.id} loan={loan} />
        ))}
      </div>
    </div>
  );
}
