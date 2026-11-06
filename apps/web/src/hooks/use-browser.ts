'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  browserReducer,
  canBack,
  canForward,
  currentEntry,
  initialBrowserState,
  viewState,
  type NavigateVia,
  type PageShown,
  type SearchResponse,
} from '@small-web/shared';
import {
  errorMessage,
  getSession,
  recordVisit,
  resolveAddress,
  saveSession,
  searchSites,
} from '@/lib/api';

export type Target = { kind: 'page'; address: string } | { kind: 'search'; query: string };

const SAVE_DEBOUNCE_MS = 500;

/**
 * One person's browser. Mount it with `key={personId}`: switching person then discards every bit of
 * state (stack, caches, in-flight requests) instead of trying to clean it up, so nothing can leak.
 *
 * The pure rules live in the shared reducer; this hook only does the I/O around it:
 *   navigate -> resolve over the API -> hand the result to the reducer
 *   every arrival -> record a visit
 *   every change to the stack -> save the session (debounced), and once more when we go away
 */
export function useBrowser(personId: string) {
  const [state, dispatch] = useReducer(browserReducer, initialBrowserState);
  const [pages] = useState(() => new Map<string, PageShown>());
  const [searches] = useState(() => new Map<string, SearchResponse>());
  const [ready, setReady] = useState(false);
  const [visitsVersion, setVisitsVersion] = useState(0);
  const token = useRef(0);
  const lastTarget = useRef<{ target: Target; via: NavigateVia } | null>(null);

  // Restore this person's saved stack.
  useEffect(() => {
    let cancelled = false;
    getSession(personId)
      .then((session) => {
        if (cancelled) return;
        dispatch({ type: 'restore', session });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true); // start empty rather than block the browser
      });
    return () => {
      cancelled = true;
    };
  }, [personId]);

  // Record one visit per arrival (including back/forward), tagged with how we got there.
  useEffect(() => {
    const arrival = state.arrival;
    if (!arrival) return;
    recordVisit(personId, { via: arrival.via, entry: arrival.entry })
      .then(() => setVisitsVersion((version) => version + 1))
      .catch(() => undefined); // history is a record, not a requirement for browsing
  }, [state.arrival, personId]);

  // Save the stack: debounced while it changes (scroll changes it constantly), flushed on the way out.
  const session = useMemo(
    () => ({ entries: [...state.entries], index: state.index }),
    [state.entries, state.index],
  );
  const latest = useRef({ session, ready });
  useEffect(() => {
    latest.current = { session, ready };
  });
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      saveSession(personId, session).catch(() => undefined);
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [personId, session, ready]);
  useEffect(() => {
    const flush = () => {
      const { session: current, ready: loaded } = latest.current;
      // Never save before the stored session has loaded: that would overwrite it with nothing.
      if (loaded) saveSession(personId, current, true).catch(() => undefined);
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, [personId]);

  const navigate = useCallback(
    async (target: Target, via: NavigateVia) => {
      token.current += 1;
      const mine = token.current;
      lastTarget.current = { target, via };
      dispatch({ type: 'begin', token: mine, via });
      try {
        if (target.kind === 'search') {
          const results = await searchSites(target.query);
          searches.set(results.query, results);
          dispatch({
            type: 'resolve',
            token: mine,
            entry: { kind: 'search', query: results.query, scrollY: 0 },
          });
          return;
        }
        const result = await resolveAddress(target.address);
        if (result.status === 'shown') {
          pages.set(result.revisionId, result);
          dispatch({
            type: 'resolve',
            token: mine,
            entry: {
              kind: 'page',
              address: result.address,
              status: 'shown',
              revisionId: result.revisionId,
              scrollY: 0,
            },
          });
        } else {
          dispatch({
            type: 'resolve',
            token: mine,
            entry: {
              kind: 'page',
              address: result.address,
              status: 'nowhere',
              revisionId: null,
              scrollY: 0,
            },
          });
        }
      } catch (error) {
        dispatch({ type: 'fail', token: mine, message: errorMessage(error) });
      }
    },
    [pages, searches],
  );

  const entry = currentEntry(state);

  /** Reload: look the current address (or query) up again, replacing the entry in place. */
  const reload = useCallback(() => {
    if (!entry) return;
    void navigate(
      entry.kind === 'search'
        ? { kind: 'search', query: entry.query }
        : { kind: 'page', address: entry.address },
      'typed',
    );
  }, [entry, navigate]);

  const retry = useCallback(() => {
    if (lastTarget.current) void navigate(lastTarget.current.target, lastTarget.current.via);
  }, [navigate]);

  return {
    state,
    entry,
    view: viewState(state),
    ready,
    canBack: canBack(state),
    canForward: canForward(state),
    pages,
    searches,
    visitsVersion,
    navigate,
    reload,
    retry,
    back: useCallback(() => dispatch({ type: 'back' }), []),
    forward: useCallback(() => dispatch({ type: 'forward' }), []),
    scrolled: useCallback((scrollY: number) => dispatch({ type: 'scrolled', scrollY }), []),
    /** After a publish, cached search results no longer reflect the web. */
    forgetSearches: useCallback(() => searches.clear(), [searches]),
  };
}
