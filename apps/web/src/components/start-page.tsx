'use client';

import { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import { getVisits } from '@/lib/api';

interface StartPageProps {
  personId: string;
  personName: string;
  onOpen: (address: string) => void;
}

/** What an empty browser shows: how to begin, and the places this person has been before. */
export function StartPage({ personId, personName, onOpen }: StartPageProps) {
  const [recent, setRecent] = useState<{ address: string; title: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    getVisits(personId)
      .then(({ visits }) => {
        if (cancelled) return;
        const seen = new Set<string>();
        const places: { address: string; title: string }[] = [];
        for (const visit of visits) {
          if (visit.status !== 'shown' || !visit.address || seen.has(visit.address)) continue;
          seen.add(visit.address);
          places.push({ address: visit.address, title: visit.title ?? visit.address });
          if (places.length === 6) break;
        }
        setRecent(places);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [personId]);

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
          <Compass className="size-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold text-stone-900">The Small Web</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Hello, {personName}. Type an address such as{' '}
          <span className="font-mono">tidepool.zz</span> in the bar above, or search for something
          that is written inside a page.
        </p>
        {recent.length > 0 && (
          <div className="mt-8 text-left">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
              Recently visited
            </h2>
            <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
              {recent.map((place) => (
                <li key={place.address}>
                  <button
                    type="button"
                    onClick={() => onOpen(place.address)}
                    className="flex w-full items-baseline justify-between gap-3 px-4 py-2.5 text-left hover:bg-stone-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700"
                  >
                    <span className="truncate text-sm font-medium text-stone-800">
                      {place.title}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-stone-500">
                      {place.address}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
