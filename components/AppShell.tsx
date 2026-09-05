'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { Button, cx } from '@/components/ui';
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
      <header className="border-b border-surface-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-xs font-bold text-white">
              RC
            </span>
            <span className="font-semibold text-ink">RemitCollateral</span>
          </Link>

          <div className="flex items-center gap-3">
            {API_MODE === 'mock' && (
              <span className="rounded-full bg-warn-soft px-2.5 py-1 text-xs font-medium text-warn ring-1 ring-inset ring-warn/20">
                Mock data
              </span>
            )}
            {guarantor && (
              <>
                <div className="text-right">
                  <p className="text-sm font-medium leading-tight text-ink">
                    {guarantor.display_name ?? 'Guarantor'}
                  </p>
                  <p className="font-mono text-xs leading-tight text-ink-muted">
                    {truncateWallet(guarantor.wallet_address)}
                  </p>
                </div>
                <Button variant="secondary" onClick={disconnect}>
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </div>

        <nav className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
          <ul className="flex gap-1">
            {navigation.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cx(
                      'inline-block whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'border-brand text-brand'
                        : 'border-transparent text-ink-muted hover:text-ink',
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

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
