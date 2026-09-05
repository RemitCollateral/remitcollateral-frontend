'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/providers/SessionProvider';
import { Button } from '@/components/ui';
import { isFreighterInstalled } from '@/lib/stellar/freighter';
import { API_MODE } from '@/lib/config';

const steps = [
  {
    title: 'You lock USDC',
    body: 'Collateral sits in a vault that is yours alone — never pooled with other guarantors.',
  },
  {
    title: 'They receive local currency',
    body: 'An off-ramp partner pays out by bank transfer or mobile money. No wallet, no seed phrase, no crypto.',
  },
  {
    title: 'They repay, you unlock',
    body: 'Each attested repayment releases collateral back to you and builds their credit history.',
  },
];

export default function ConnectPage() {
  const router = useRouter();
  const { status, connect, connecting, error } = useSession();

  useEffect(() => {
    if (status === 'connected') router.replace('/dashboard');
  }, [status, router]);

  return (
    <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
      <div>
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-sm font-bold text-white">
            RC
          </span>
          <span className="font-semibold text-ink">RemitCollateral</span>
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-ink">
          Guarantee a loan back home without sending money.
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          Lock USDC on Stellar as collateral. Your beneficiary receives local currency,
          repays through the channel they already use, and your collateral is released as
          they do.
        </p>

        <div className="mt-8">
          <Button onClick={connect} disabled={connecting} className="px-6 py-3 text-base">
            {connecting ? 'Waiting for signature…' : 'Connect Stellar wallet'}
          </Button>

          <p className="mt-3 text-sm text-ink-muted">
            {isFreighterInstalled()
              ? 'Freighter detected. You will be asked to sign a challenge — no transaction, no fee.'
              : API_MODE === 'mock'
                ? 'Freighter is not installed. Running in mock mode, a simulated wallet will be used.'
                : 'Freighter is required to connect. Install the extension, then reload this page.'}
          </p>

          {error && (
            <p className="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>
          )}
        </div>
      </div>

      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-xl border border-surface-border bg-surface p-5"
          >
            <div className="flex items-start gap-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft font-mono text-sm font-semibold text-brand">
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-ink">{step.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{step.body}</p>
              </div>
            </div>
          </li>
        ))}
        <li className="rounded-xl border border-warn/30 bg-warn-soft p-5 text-sm text-warn">
          <p className="font-medium">If they do not repay, you lose the collateral.</p>
          <p className="mt-1 text-warn/90">
            A missed installment starts a grace period. When it expires, the outstanding
            portion of your USDC is forfeited. You will see this risk on every loan before
            you originate it.
          </p>
        </li>
      </ol>
    </div>
  );
}
