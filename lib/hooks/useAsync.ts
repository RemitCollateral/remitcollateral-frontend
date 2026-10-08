'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-runs the loader, e.g. after a mutation. */
  reload: () => void;
}

// Global client cache map for stale-while-revalidate behavior
const memoryCache = new Map<string, { data: unknown; timestamp: number }>();

export interface AsyncOptions {
  key?: string;
  cacheTtlMs?: number;
}

/**
 * Runs an async loader on mount and whenever `deps` change, with SWR caching
 * to eliminate UI flicker and layout shift between route navigation.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
  options: AsyncOptions = {}
): AsyncState<T> {
  const { key, cacheTtlMs = 60_000 } = options;
  const cached = key ? (memoryCache.get(key)?.data as T | undefined) : undefined;

  const [data, setData] = useState<T | null>(cached ?? null);
  const [loading, setLoading] = useState(cached === undefined);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // Kept in a ref so a changing inline closure does not retrigger the effect.
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let cancelled = false;

    // If no cached data exists, set loading state
    if (!cached) {
      setLoading(true);
    }
    setError(null);

    loaderRef
      .current()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          if (key) {
            memoryCache.set(key, { data: result, timestamp: Date.now() });
          }
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Something went wrong.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  const reload = useCallback(() => {
    if (key) memoryCache.delete(key);
    setNonce((n) => n + 1);
  }, [key]);

  return { data, loading, error, reload };
}

