'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { ScheduleTable } from '@/components/ScheduleTable';
import {
  Button,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  ErrorNotice,
  Field,
  Skeleton,
  inputClass,
} from '@/components/ui';
import { api, buildLoanQuote } from '@/lib/api';
import { useAsync } from '@/lib/hooks/useAsync';
import { PROTOCOL } from '@/lib/config';
import { formatLocal, formatRatio, formatUsd } from '@/lib/format';
import type { LoanQuote } from '@/lib/types';

export default function NewLoanPage() {
  const router = useRouter();
  const beneficiaries = useAsync(() => api.listBeneficiaries());

  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [principal, setPrincipal] = useState('');
  const [installmentCount, setInstallmentCount] = useState('6');
  const [intervalDays, setIntervalDays] = useState('30');
  const [purpose, setPurpose] = useState('');

  const [quote, setQuote] = useState<LoanQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const beneficiary = useMemo(
    () => beneficiaries.data?.find((b) => b.id === beneficiaryId) ?? null,
    [beneficiaries.data, beneficiaryId],
  );

  const principalAmount = Number(principal);
  const installments = Number(installmentCount);
  const interval = Number(intervalDays);

  const inputsValid =
    beneficiary !== null &&
    Number.isFinite(principalAmount) &&
    principalAmount > 0 &&
    Number.isInteger(installments) &&
    installments >= 1 &&
    Number.isInteger(interval) &&
    interval >= 1;

  // Re-quote as the guarantor types, so the collateral cost is never a surprise
  // at the point of submission.
  useEffect(() => {
    if (!inputsValid || !beneficiary) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    setQuoting(true);

    const timer = setTimeout(() => {
      buildLoanQuote(api, {
        beneficiary_id: beneficiary.id,
        principal_local: principalAmount,
        local_currency: beneficiary.local_currency,
        installment_count: installments,
        installment_interval_days: interval,
      })
        .then((result) => {
          if (!cancelled) setQuote(result);
        })
        .catch(() => {
          if (!cancelled) setQuote(null);
        })
        .finally(() => {
          if (!cancelled) setQuoting(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inputsValid, beneficiary, principalAmount, installments, interval]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!beneficiary || !quote?.sufficient_collateral) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const loan = await api.createLoan({
        beneficiary_id: beneficiary.id,
        principal_local: principalAmount,
        local_currency: beneficiary.local_currency,
        installment_count: installments,
        installment_interval_days: interval,
        purpose: purpose.trim() || undefined,
      });
      router.push(`/loans/${loan.id}`);
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : 'Could not originate the loan.');
      setSubmitting(false);
    }
  }

  if (beneficiaries.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (beneficiaries.error) {
    return <ErrorNotice message={beneficiaries.error} onRetry={beneficiaries.reload} />;
  }

  if (beneficiaries.data?.length === 0) {
    return (
      <div>
        <PageHeader title="Originate a loan" />
        <EmptyState
          title="No beneficiaries yet"
          description="Register the person who will receive and repay the loan before originating one."
          action={<ButtonLink href="/beneficiaries">Register a beneficiary</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Originate a loan"
        description="Your collateral secures this loan. The cost to you, and what you stand to lose, is shown before you commit."
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader title="Loan terms" />
            <div className="space-y-4">
              <Field
                label="Beneficiary"
                hint="They receive local currency and repay through their usual channel."
              >
                <select
                  className={inputClass}
                  value={beneficiaryId}
                  onChange={(e) => setBeneficiaryId(e.target.value)}
                  required
                >
                  <option value="">Select a beneficiary</option>
                  {beneficiaries.data?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.display_name ?? b.phone_number} ({b.local_currency})
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label={`Principal${beneficiary ? ` (${beneficiary.local_currency})` : ''}`}
                hint="The amount the beneficiary receives, in their local currency."
              >
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  step="any"
                  inputMode="decimal"
                  placeholder="500000"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  disabled={!beneficiary}
                  required
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Installments">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    max="36"
                    step="1"
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Days between installments">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    max="90"
                    step="1"
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <Field label="Purpose" hint="Optional, for your own records.">
                <input
                  className={inputClass}
                  type="text"
                  maxLength={140}
                  placeholder="Restocking inventory"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </Field>
            </div>
          </Card>

          {quote && (
            <Card>
              <CardHeader
                title="Repayment schedule"
                description={`${quote.schedule.length} installments, every ${interval} days.`}
              />
              <ScheduleTable schedule={quote.schedule} currency={quote.local_currency} />
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="What this costs you" />

            {!inputsValid && (
              <p className="text-sm text-ink-muted">
                Choose a beneficiary and enter an amount to see the collateral required.
              </p>
            )}

            {inputsValid && quoting && !quote && <Skeleton className="h-40" />}

            {quote && (
              <>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Beneficiary receives</dt>
                    <dd className="font-mono tabular-nums text-ink">
                      {formatLocal(quote.principal_local, quote.local_currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Value in USDC</dt>
                    <dd className="font-mono tabular-nums text-ink">
                      {formatUsd(quote.principal_usd)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Required LTV</dt>
                    <dd className="font-mono tabular-nums text-ink">
                      {formatRatio(quote.ltv_ratio)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-surface-border pt-3">
                    <dt className="font-medium text-ink">Collateral you lock</dt>
                    <dd className="font-mono text-base font-semibold tabular-nums text-ink">
                      {formatUsd(quote.required_collateral_usd)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Available in your vault</dt>
                    <dd
                      className={
                        quote.sufficient_collateral
                          ? 'font-mono tabular-nums text-good'
                          : 'font-mono tabular-nums text-bad'
                      }
                    >
                      {formatUsd(quote.available_collateral_usd)}
                    </dd>
                  </div>
                </dl>

                <p className="mt-4 rounded-lg bg-surface-sunken px-3 py-2 text-xs text-ink-muted">
                  Collateral is released as repayments are attested. A{' '}
                  {formatRatio(PROTOCOL.safetyBuffer)} buffer (
                  {formatUsd(quote.safety_buffer_usd)}) is held back until the final
                  installment clears.
                </p>

                <div className="mt-4 rounded-lg border border-warn/30 bg-warn-soft px-3 py-2.5 text-xs text-warn">
                  <p className="font-medium">If they stop repaying, you lose this collateral.</p>
                  <p className="mt-1 text-warn/90">
                    A missed installment opens a {PROTOCOL.gracePeriodDays}-day grace period.
                    When it expires, the collateral covering the outstanding balance is
                    forfeited and cannot be recovered.
                  </p>
                </div>

                {!quote.sufficient_collateral && (
                  <div className="mt-4 rounded-lg bg-bad-soft px-3 py-2.5 text-xs text-bad">
                    <p className="font-medium">Not enough available collateral.</p>
                    <p className="mt-1">
                      You need {formatUsd(quote.required_collateral_usd - quote.available_collateral_usd)}{' '}
                      more.{' '}
                      <Link href="/vault" className="font-medium underline underline-offset-2">
                        Deposit USDC
                      </Link>{' '}
                      or lower the principal.
                    </p>
                  </div>
                )}
              </>
            )}

            {submitError && (
              <div className="mt-4">
                <ErrorNotice message={submitError} />
              </div>
            )}

            <Button
              type="submit"
              className="mt-5 w-full"
              disabled={!quote?.sufficient_collateral || submitting || quoting}
            >
              {submitting ? 'Originating…' : 'Lock collateral and originate'}
            </Button>
          </Card>

          {beneficiary && (
            <Card>
              <CardHeader title="Why this LTV" />
              <p className="text-sm text-ink-muted">
                {beneficiary.display_name ?? beneficiary.phone_number} qualifies for{' '}
                {quote ? formatRatio(quote.ltv_ratio) : '—'} against a{' '}
                {formatRatio(PROTOCOL.baseLtv)} base, based on their remittance and repayment
                history.
              </p>
              <Link
                href={`/beneficiaries/${beneficiary.id}`}
                className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
              >
                See the full breakdown
              </Link>
            </Card>
          )}
        </div>
      </form>
    </div>
  );
}
