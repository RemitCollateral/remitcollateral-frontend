'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { Logo } from '@/components/Logo';
import { cx } from '@/components/ui';
import { API_MODE } from '@/lib/config';
import { truncateWallet } from '@/lib/format';

const navigation = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/loans', label: 'Loans' },
  { href: '/beneficiaries', label: 'Beneficiaries' },
  { href: '/vault', label: 'Vault' },
  { href: '/remittances', label: 'Remittances' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { guarantor, disconnect } = useSession();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-forest-line bg-forest/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/dashboard" aria-label="RemitCollateral dashboard">
            <Logo tone="light" />
          </Link>

          <div className="flex items-center gap-3">
            {API_MODE === 'mock' && (
              <span className="rounded-full bg-gold-bright/15 px-2.5 py-1 text-xs font-semibold text-gold-bright ring-1 ring-inset ring-gold-bright/30">
                Mock data
              </span>
            )}
            {guarantor && (
              <>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium leading-tight text-white">
                    {guarantor.display_name ?? 'Guarantor'}
                  </p>
                  <p className="font-mono text-xs leading-tight text-forest-text">
                    {truncateWallet(guarantor.wallet_address)}
                  </p>
                </div>
                <button
                  onClick={disconnect}
                  className="rounded-xl border border-forest-line px-3.5 py-2 text-sm font-semibold text-forest-text transition-colors hover:border-forest-text/50 hover:text-white"
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        <nav aria-label="Primary" className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
          <ul className="flex gap-1">
            {navigation.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'inline-block whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-medium transition-colors',
                      active
                        ? 'border-gold-bright text-white'
                        : 'border-transparent text-forest-text hover:text-white',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>

      <footer className="mx-auto max-w-6xl border-t border-surface-border px-4 py-6 text-xs text-ink-muted sm:px-6">
        <p>
          RemitCollateral is non-custodial: your USDC stays in a vault only you control. Loans
          carry risk of collateral forfeiture on default.
        </p>
      </footer>
    </div>
  );
}
