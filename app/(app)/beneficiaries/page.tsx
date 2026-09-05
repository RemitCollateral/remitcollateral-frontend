'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { ReputationMeter } from '@/components/ReputationMeter';
import {
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
import { formatDate, maskPhone } from '@/lib/format';

const CURRENCIES = ['NGN', 'GHS', 'KES', 'XOF'];

export default function BeneficiariesPage() {
  const { data, loading, error, reload } = useAsync(() => api.listBeneficiaries());

  const [showForm, setShowForm] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [kycRef, setKycRef] = useState('');
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await api.createBeneficiary({
        phone_number: phone.trim(),
        display_name: displayName.trim() || undefined,
        local_kyc_ref: kycRef.trim() || undefined,
        local_currency: currency,
      });
      setDisplayName('');
      setPhone('');
      setKycRef('');
      setShowForm(false);
      reload();
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : 'Could not register the beneficiary.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Beneficiaries"
        description="The people your loans reach. They never need a wallet — the off-ramp partner holds their KYC and moves the money."
        action={
          <Button variant={showForm ? 'secondary' : 'primary'} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'Register beneficiary'}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader
            title="Register a beneficiary"
            description="The KYC reference comes from your off-ramp partner. RemitCollateral stores the reference, never the identity documents."
          />
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" hint="For your records.">
              <input
                className={inputClass}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Amaka Obi"
              />
            </Field>
            <Field label="Phone number" hint="Used for SMS notifications and payouts.">
              <input
                className={inputClass}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+2348031234567"
                required
              />
            </Field>
            <Field label="Partner KYC reference">
              <input
                className={inputClass}
                value={kycRef}
                onChange={(e) => setKycRef(e.target.value)}
                placeholder="PARTNER-NG-00000"
              />
            </Field>
            <Field label="Local currency">
              <select
                className={inputClass}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </Field>

            {formError && (
              <div className="sm:col-span-2">
                <ErrorNotice message={formError} />
              </div>
            )}

            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Registering…' : 'Register beneficiary'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {error && <ErrorNotice message={error} onRetry={reload} />}

      {data?.length === 0 && !showForm && (
        <EmptyState
          title="No beneficiaries yet"
          description="Register the person who will receive a loan. Their repayment history builds a credit record they can use later."
          action={<Button onClick={() => setShowForm(true)}>Register beneficiary</Button>}
        />
      )}

      <div className="space-y-3">
        {data?.map((beneficiary) => (
          <Link
            key={beneficiary.id}
            href={`/beneficiaries/${beneficiary.id}`}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-surface-border bg-surface p-5 transition-colors hover:border-brand/40"
          >
            <div>
              <p className="font-medium text-ink">
                {beneficiary.display_name ?? beneficiary.phone_number}
              </p>
              <p className="mt-0.5 font-mono text-sm text-ink-muted">
                {maskPhone(beneficiary.phone_number)} · {beneficiary.local_currency}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Linked since {formatDate(beneficiary.created_at)}
              </p>
            </div>
            <div className="min-w-[10rem]">
              <p className="mb-1 text-xs uppercase tracking-wide text-ink-muted">Reputation</p>
              <ReputationMeter score={beneficiary.reputation_score} compact />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
