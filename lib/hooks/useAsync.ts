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
  /** Automatically revalidate when browser window gains focus (defaults to true). */
  revalidateOnFocus?: boolean;
  /** Periodic polling interval in ms (disabled by default). Pauses when tab is hidden. */
  pollIntervalMs?: number;
}

/**
 * Runs an async loader on mount and whenever `deps` change, with SWR caching,
 * window focus revalidation, and tab-visibility-aware polling.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
  options: AsyncOptions = {}
): AsyncState<T> {
  const {
    key,
    cacheTtlMs = 60_000,
    revalidateOnFocus = true,
    pollIntervalMs,
  } = options;
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

  // Window focus & tab visibility change listener
  useEffect(() => {
    if (!revalidateOnFocus) return;

    function handleFocusOrVisible() {
      if (document.visibilityState === 'visible') {
        setNonce((n) => n + 1);
      }
    }

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [revalidateOnFocus]);

  // Periodic polling when tab is visible
  useEffect(() => {
    if (!pollIntervalMs || pollIntervalMs <= 0) return;

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setNonce((n) => n + 1);
      }
    }, pollIntervalMs);

    return () => clearInterval(intervalId);
  }, [pollIntervalMs]);

  const reload = useCallback(() => {
    if (key) memoryCache.delete(key);
    setNonce((n) => n + 1);
  }, [key]);

  return { data, loading, error, reload };
}

