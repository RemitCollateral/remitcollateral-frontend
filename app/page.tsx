'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { useSession } from '@/components/providers/SessionProvider';
import { Button } from '@/components/ui';
import { detectFreighter } from '@/lib/stellar/freighter';

const steps = [
  {
    title: 'You lock USDC',
    body: 'Collateral sits in a vault that is yours alone, never pooled with other guarantors.',
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

const principles = [
  {
    title: 'Non-custodial by design',
    body: 'Your USDC lives in a Stellar vault only your wallet can authorise. We never hold your keys.',
  },
  {
    title: 'Pay-as-they-repay release',
    body: 'Collateral comes back in proportion to each verified repayment, not in one lump at the end.',
  },
  {
    title: 'Risk stated up front',
    body: 'Before every loan you see exactly what you stand to lose if it is not repaid. No fine print.',
  },
];

export default function ConnectPage() {
  const router = useRouter();
  const { status, connect, connecting, error } = useSession();
  // null while we are still asking the extension; detection is asynchronous.
  const [freighter, setFreighter] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === 'connected') router.replace('/dashboard');
  }, [status, router]);

  useEffect(() => {
    let cancelled = false;
    detectFreighter().then((found) => {
      if (!cancelled) setFreighter(found);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-surface-sunken">
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest bg-grid-dark text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-48 left-0 h-[28rem] w-[28rem] rounded-full bg-gold/10 blur-3xl"
        />

        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Logo tone="light" />
          <span className="hidden items-center gap-2 rounded-full border border-forest-line px-3 py-1.5 text-xs font-medium text-forest-text sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-bright" aria-hidden="true" />
            Built on Stellar
          </span>
        </header>

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:pb-32 lg:pt-16">
          <div className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-bright">
              Collateral-backed lending for family back home
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              Guarantee a loan back home{' '}
              <span className="text-gold-gradient">without sending money.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-forest-text">
              Lock USDC on Stellar as collateral. Your beneficiary receives local currency,
              repays through the channel they already use, and your collateral is released as
              they do.
            </p>

            <div className="mt-9">
              <Button
                variant="gold"
                onClick={connect}
                disabled={connecting}
                className="px-7 py-3.5 text-base"
              >
                {connecting ? 'Waiting for signature…' : 'Connect Stellar wallet'}
              </Button>

              <p className="mt-4 max-w-md text-sm leading-relaxed text-forest-text/80">
                {freighter === null
                  ? 'Looking for Freighter…'
                  : freighter
                    ? 'Freighter detected. You will be asked to sign a challenge: no transaction, no fee.'
                    : 'Freighter is required to connect. Install the extension from freighter.app, allow it on this site, then reload this page.'}
              </p>

              {error && (
                <p
                  role="alert"
                  className="mt-4 max-w-md rounded-xl border border-bad/40 bg-bad/15 px-3.5 py-2.5 text-sm text-[#ffd5d0]"
                >
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* Product preview */}
          <div aria-hidden="true" className="relative animate-fade-up [animation-delay:150ms]">
            <div className="rounded-2xl border border-forest-line bg-forest-raised/90 p-6 shadow-glow backdrop-blur">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest-text/70">
                    Collateral locked
                  </p>
                  <p className="mt-2 font-mono text-4xl font-semibold tracking-tight text-white">
                    $1,250.00
                  </p>
                </div>
                <span className="rounded-full bg-good/20 px-2.5 py-1 text-xs font-semibold text-[#7be0b0] ring-1 ring-inset ring-good/40">
                  Active
                </span>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs text-forest-text">
                  <span>Amara · 6 of 10 repaid</span>
                  <span className="font-mono">60%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-forest">
                  <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-gold to-gold-bright" />
                </div>
              </div>

              <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-forest-line pt-5">
                {[
                  ['Released', '$750'],
                  ['LTV', '50%'],
                  ['Next due', '4 days'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] text-forest-text/70">{label}</dt>
                    <dd className="mt-1 font-mono text-sm font-semibold text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="absolute -bottom-12 -left-6 hidden rounded-xl border border-forest-line bg-forest px-4 py-3 shadow-glow sm:block">
              <p className="text-[11px] text-forest-text/70">Beneficiary received</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-gold-bright">
                ₦ 1,850,000
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          How it works
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Three steps. One side holds the crypto, the other never has to.
        </h2>

        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-surface-border bg-surface p-6 shadow-card"
            >
              <span className="font-display text-5xl font-semibold text-gold/70">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p className="mt-4 font-display text-xl font-semibold text-ink">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Principles */}
      <section className="border-y border-surface-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3">
          {principles.map((item) => (
            <div key={item.title}>
              <span aria-hidden="true" className="block h-0.5 w-8 bg-gold" />
              <p className="mt-4 font-display text-lg font-semibold text-ink">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Risk, stated plainly */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-2xl border border-warn/30 border-l-4 border-l-warn bg-warn-soft p-7 sm:p-8">
          <p className="font-display text-xl font-semibold text-warn">
            If they do not repay, you lose the collateral.
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-warn/90">
            A missed installment starts a grace period. When it expires, the outstanding
            portion of your USDC is forfeited. You will see this risk on every loan before you
            originate it.
          </p>
        </div>
      </section>

      <footer className="border-t border-surface-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-ink-muted">
          <Logo />
          <p>Non-custodial. Loans carry risk of collateral forfeiture.</p>
        </div>
      </footer>
    </div>
  );
}
