'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Critical root error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-surface-sunken p-6">
        <div className="max-w-md rounded-2xl border border-bad/20 bg-surface p-6 text-center shadow-lift">
          <h2 className="text-xl font-bold text-bad">Application Error</h2>
          <p className="mt-2 text-sm text-ink-muted">
            {error.message || 'A critical error prevented the application from loading.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => reset()}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              Reload application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
