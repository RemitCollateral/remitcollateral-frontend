'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSession } from '@/components/providers/SessionProvider';
import { Skeleton } from '@/components/ui';

/** Every route below this layout requires a connected wallet. */
export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'disconnected') router.replace('/');
  }, [status, router]);

  if (status !== 'connected') {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-6 py-16">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
