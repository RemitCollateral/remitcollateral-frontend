import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
// Self-hosted variable fonts: no third-party requests at build or run time.
import '@fontsource-variable/inter';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'RemitCollateral — Back a loan back home, without sending money',
    template: '%s · RemitCollateral',
  },
  description:
    'Lock USDC collateral on Stellar to guarantee a loan your beneficiary receives, repays, and never needs a wallet for.',
  openGraph: {
    title: 'RemitCollateral',
    description:
      'Guarantee a loan for family back home with USDC collateral on Stellar. They receive local currency; you stay in control.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#08241f',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
