'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorNotice,
  Field,
  Skeleton,
  inputClass,
} from '@/components/ui';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks/useAsync';
import { PROTOCOL } from '@/lib/config';
import { formatDate, formatLocal, formatUsd } from '@/lib/format';

export default function RemittancesPage() {
  const remittances = useAsync(() => api.listRemittances());
  const beneficiaries = useAsync(() => api.listBeneficiaries());

  const [showForm, setShowForm] = useState(false);
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [amountUsd, setAmountUsd] = useState('');
  const [localAmount, setLocalAmount] = useState('');
  const [sentAt, setSentAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const beneficiary = beneficiaries.data?.find((b) => b.id === beneficiaryId) ?? null;

  function nameFor(id: string): string {
    const match = beneficiaries.data?.find((b) => b.id === id);
    return match?.display_name ?? match?.phone_number ?? id;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!beneficiary) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await api.createRemittance({
        beneficiary_id: beneficiary.id,
        amount_usd: Number(amountUsd),
        local_amount: Number(localAmount),
        local_currency: beneficiary.local_currency,
        sent_at: new Date(sentAt).toISOString(),
        source: 'self_declared',
      });
      setAmountUsd('');
      setLocalAmount('');
      setShowForm(false);
      remittances.reload();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Could not record the remittance.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Remittances"
        description="Money you already send is the cold-start credit signal. Partner-reported transfers build a beneficiary's score before they have ever taken a loan."
        action={
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Cancel' : 'Record a remittance'}
          </Button>
        }
      />

      <div className="mb-6 rounded-xl border border-surface-border bg-brand-soft/40 px-4 py-3 text-sm text-ink-muted">
        Self-declared records are stored but weighted at zero in v1 — they are not trusted
        until they can be verified. Only partner-reported transfers move a score, and only
        after {PROTOCOL.minRemittanceMonths} months of history.
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader
            title="Record a remittance"
            description="Recorded as self-declared. It appears in the history but does not raise the score."
          />
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Beneficiary">
              <select
                className={inputClass}
                value={beneficiaryId}
                onChange={(e) => setBeneficiaryId(e.target.value)}
                required
              >
                <option value="">Select a beneficiary</option>
                {beneficiaries.data?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.display_name ?? b.phone_number}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date sent">
              <input
                className={inputClass}
                type="date"
                value={sentAt}
                onChange={(e) => setSentAt(e.target.value)}
                required
              />
            </Field>
            <Field label="Amount sent (USD)">
              <input
                className={inputClass}
                type="number"
                min="0"
                step="any"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                required
              />
            </Field>
            <Field
              label={`Amount received${beneficiary ? ` (${beneficiary.local_currency})` : ''}`}
            >
              <input
                className={inputClass}
                type="number"
                min="0"
                step="any"
                value={localAmount}
                onChange={(e) => setLocalAmount(e.target.value)}
                disabled={!beneficiary}
                required
              />
            </Field>

            {formError && (
              <div className="sm:col-span-2">
                <ErrorNotice message={formError} />
              </div>
            )}

            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting || !beneficiary}>
                {submitting ? 'Recording…' : 'Record remittance'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {remittances.loading && (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}

      {remittances.error && (
        <ErrorNotice message={remittances.error} onRetry={remittances.reload} />
      )}

      {remittances.data?.length === 0 && (
        <EmptyState
          title="No remittances recorded"
          description="Once your off-ramp partner reports the transfers you already send, they appear here and start building reputation."
        />
      )}

      {remittances.data && remittances.data.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem] text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="pb-2 pr-4 font-medium">Beneficiary</th>
                  <th className="pb-2 pr-4 font-medium">Sent</th>
                  <th className="pb-2 pr-4 font-medium">Received</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {remittances.data.slice(0, 60).map((record) => (
                  <tr key={record.id}>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/beneficiaries/${record.beneficiary_id}`}
                        className="font-medium text-ink hover:text-brand"
                      >
                        {nameFor(record.beneficiary_id)}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-mono tabular-nums text-ink">
                      {formatUsd(record.amount_usd)}
                    </td>
                    <td className="py-3 pr-4 font-mono tabular-nums text-ink-muted">
                      {formatLocal(record.local_amount, record.local_currency)}
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">{formatDate(record.sent_at)}</td>
                    <td className="py-3">
                      <Badge tone={record.source === 'partner_reported' ? 'good' : 'neutral'}>
                        {record.source === 'partner_reported' ? 'Partner' : 'Self-declared'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
