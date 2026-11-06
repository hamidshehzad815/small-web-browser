'use client';

import { useEffect, useReducer, useState } from 'react';
import { errorMessage } from '@/lib/api';

/**
 * Reads `key` from `cache`, fetching it on a miss. Back/forward hit the cache, so a page is shown
 * exactly as it was left without a round trip; after a tab reload the cache is empty and it refills.
 */
export function useCached<V>(
  key: string | null,
  cache: Map<string, V>,
  fetcher: (key: string) => Promise<V>,
) {
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (key === null || cache.has(key)) return;
    let cancelled = false;
    fetcher(key)
      .then((value) => {
        cache.set(key, value);
        if (!cancelled) rerender();
      })
      .catch((error: unknown) => {
        if (!cancelled) setFailure({ key, message: errorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [key, cache, fetcher, attempt]);

  const value = key === null ? null : (cache.get(key) ?? null);
  const error = failure !== null && failure.key === key ? failure.message : null;
  const retry = () => {
    setFailure(null);
    setAttempt((count) => count + 1);
  };
  return { value, error, loading: key !== null && value === null && error === null, retry };
}
