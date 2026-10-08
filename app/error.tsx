'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md rounded-2xl border border-bad/30 bg-bad-soft p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-bad">Something went wrong</h2>
        <p className="mt-2 text-sm text-ink-muted">
          {error.message || 'An unexpected error occurred while communicating with the protocol.'}
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-ink-muted">Error code: {error.digest}</p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
          <Button variant="secondary" onClick={() => (window.location.href = '/')}>
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
