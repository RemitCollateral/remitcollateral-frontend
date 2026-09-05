'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import {
  Button,
  Card,
  CardHeader,
  ErrorNotice,
  Field,
  ProgressBar,
  Skeleton,
  StatTile,
  inputClass,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks/useAsync';
import { useSession } from '@/components/providers/SessionProvider';
import { formatUsd } from '@/lib/format';

type Action = 'deposit' | 'withdraw';

export default function VaultPage() {
  const { guarantor } = useSession();
  const { data: vault, loading, error, reload } = useAsync(() => api.getVault());

  const [action, setAction] = useState<Action>('deposit');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setFormError('Enter an amount greater than zero.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setNotice(null);
    try {
      if (action === 'deposit') {
        await api.depositCollateral(value);
        setNotice(`Deposited ${formatUsd(value)} into your vault.`);
      } else {
        await api.withdrawCollateral(value);
        setNotice(`Withdrew ${formatUsd(value)} to your wallet.`);
      }
      setAmount('');
      reload();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'The transaction failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) return <ErrorNotice message={error} onRetry={reload} />;
  if (!vault) return null;

  const lockedRatio =
    vault.collateral_balance > 0 ? vault.locked_amount / vault.collateral_balance : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vault"
        description="Your collateral vault is isolated — never pooled with other guarantors, so your risk stays contained to the loans you chose to back."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Deposited" value={formatUsd(vault.collateral_balance)} hint="Total USDC" />
        <StatTile
          label="Locked"
          value={formatUsd(vault.locked_amount)}
          hint="Backing open loans"
          tone={vault.locked_amount > 0 ? 'warn' : 'neutral'}
        />
        <StatTile
          label="Available"
          value={formatUsd(vault.available_amount)}
          hint="Withdrawable now"
          tone="good"
        />
      </div>

      <Card>
        <CardHeader title="Collateral utilisation" />
        <ProgressBar value={lockedRatio} tone={lockedRatio > 0.85 ? 'warn' : 'brand'} />
        <p className="mt-2 text-sm text-ink-muted">
          {Math.round(lockedRatio * 100)}% of your collateral is committed. Locked collateral is
          released proportionally as each repayment is attested.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Move collateral"
            description="Deposits accept USDC only in v1. Withdrawals are limited to unlocked collateral."
          />

          <div className="mb-4 inline-flex rounded-lg bg-surface-sunken p-1">
            {(['deposit', 'withdraw'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setAction(option);
                  setFormError(null);
                  setNotice(null);
                }}
                className={
                  action === option
                    ? 'rounded-md bg-surface px-4 py-1.5 text-sm font-medium capitalize text-ink shadow-sm'
                    : 'rounded-md px-4 py-1.5 text-sm font-medium capitalize text-ink-muted'
                }
              >
                {option}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Amount (USDC)"
              hint={
                action === 'withdraw'
                  ? `${formatUsd(vault.available_amount)} available to withdraw`
                  : 'Signed with your Stellar wallet and recorded against your vault.'
              }
            >
              <input
                className={inputClass}
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Field>

            {formError && <ErrorNotice message={formError} />}
            {notice && (
              <p className="rounded-lg bg-good-soft px-3 py-2 text-sm text-good">{notice}</p>
            )}

            <Button type="submit" disabled={submitting}>
              {submitting
                ? 'Submitting…'
                : action === 'deposit'
                  ? 'Deposit USDC'
                  : 'Withdraw USDC'}
            </Button>
          </form>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Vault details" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Vault ID</dt>
              <dd className="font-mono text-xs text-ink">{vault.id}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Guarantor wallet</dt>
              <dd className="break-all font-mono text-xs text-ink">
                {guarantor?.wallet_address}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Collateral asset</dt>
              <dd className="text-ink">USDC on Stellar</dd>
            </div>
          </dl>
          <p className="mt-4 rounded-lg bg-surface-sunken px-3 py-2 text-xs text-ink-muted">
            Settlement runs through Soroban contracts. This dashboard reflects vault state; it
            never custodies your funds.
          </p>
        </Card>
      </div>
    </div>
  );
}
