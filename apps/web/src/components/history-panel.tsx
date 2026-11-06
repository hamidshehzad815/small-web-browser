'use client';

import { useEffect, useState } from 'react';
import type { VisitDto } from '@small-web/shared';
import { CircleSlash, Loader2, Search } from 'lucide-react';
import { errorMessage, getVisits } from '@/lib/api';
import { dayLabel, timeLabel, VIA_LABEL, visitLabel } from '@/lib/format';

interface HistoryPanelProps {
  personId: string;
  personName: string;
  /** Bumps whenever a new visit has been recorded, so the list stays current while open. */
  version: number;
  onOpen: (visit: VisitDto) => void;
}

interface Loaded {
  visits: VisitDto[];
  nextCursor: string | null;
}

export function HistoryPanel({ personId, personName, version, onOpen }: HistoryPanelProps) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getVisits(personId)
      .then((page) => {
        if (cancelled) return;
        setLoaded(page);
        setError(null);
      })
      .catch((failure: unknown) => {
        if (!cancelled) setError(errorMessage(failure));
      });
    return () => {
      cancelled = true;
    };
  }, [personId, version]);

  async function loadMore() {
    if (!loaded?.nextCursor) return;
    setLoadingMore(true);
    try {
      const page = await getVisits(personId, loaded.nextCursor);
      setLoaded({ visits: [...loaded.visits, ...page.visits], nextCursor: page.nextCursor });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setLoadingMore(false);
    }
  }

  if (error && !loaded)
    return (
      <p role="alert" className="p-4 text-sm text-red-700">
        {error}
      </p>
    );
  if (!loaded) {
    return (
      <p className="flex items-center gap-2 p-4 text-sm text-stone-500">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Loading history…
      </p>
    );
  }
  if (loaded.visits.length === 0) {
    return (
      <p className="p-4 text-sm leading-6 text-stone-500">
        {personName} has not visited anything yet. Pages you open will be listed here, newest first.
      </p>
    );
  }

  const groups: { day: string; visits: VisitDto[] }[] = [];
  for (const visit of loaded.visits) {
    const day = dayLabel(visit.at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.visits.push(visit);
    else groups.push({ day, visits: [visit] });
  }

  return (
    <div className="pb-4">
      {error && (
        <p role="alert" className="px-4 pt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {groups.map((group) => (
        <section key={group.day} aria-label={group.day}>
          <h3 className="sticky top-0 border-b border-stone-100 bg-white/95 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-stone-500 backdrop-blur">
            {group.day}
          </h3>
          <ul>
            {group.visits.map((visit) => (
              <li key={visit.id}>
                <button
                  type="button"
                  onClick={() => onOpen(visit)}
                  className="flex w-full items-start gap-3 px-4 py-2 text-left hover:bg-stone-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700"
                >
                  <span className="mt-0.5 shrink-0 font-mono text-xs text-stone-400">
                    {timeLabel(visit.at)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      {visit.kind === 'search' && (
                        <Search className="size-3.5 shrink-0 text-stone-400" aria-hidden />
                      )}
                      {visit.status === 'nowhere' && (
                        <CircleSlash className="size-3.5 shrink-0 text-stone-400" aria-hidden />
                      )}
                      <span className="truncate text-sm font-medium text-stone-800">
                        {visitLabel(visit)}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-stone-500">
                      {visit.kind === 'page' && (
                        <span className="font-mono">{visit.address} · </span>
                      )}
                      {visit.status === 'nowhere' && 'nowhere · '}
                      {VIA_LABEL[visit.via]}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {loaded.nextCursor && (
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full rounded-lg border border-stone-300 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
          >
            {loadingMore ? 'Loading…' : 'Load older visits'}
          </button>
        </div>
      )}
    </div>
  );
}
