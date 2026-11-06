'use client';

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import type { Address, SearchResponse, SnippetDto } from '@small-web/shared';
import { Loader2, SearchX } from 'lucide-react';
import { useCached } from '@/hooks/use-cached';
import { searchSites } from '@/lib/api';
import { Notice } from './notice';

interface SearchPageProps {
  query: string;
  /** Changes on every arrival; scroll is restored then, not while the person scrolls. */
  arrivalKey: number;
  scrollY: number;
  searches: Map<string, SearchResponse>;
  onOpen: (address: Address) => void;
  onScroll: (scrollY: number) => void;
}

function Highlighted({ text, ranges }: SnippetDto) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([from, to], index) => {
    if (from > cursor) parts.push(text.slice(cursor, from));
    parts.push(
      <mark key={index} className="rounded bg-amber-100 px-0.5 text-stone-900">
        {text.slice(from, to)}
      </mark>,
    );
    cursor = to;
  });
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}

export function SearchPage({
  query,
  arrivalKey,
  scrollY,
  searches,
  onOpen,
  onScroll,
}: SearchPageProps) {
  const { value: results, error, loading, retry } = useCached(query, searches, searchSites);
  const container = useRef<HTMLDivElement>(null);

  // Put the scroll position back when we arrive here (back/forward), once the results are on screen.
  const wanted = useRef(scrollY);
  useLayoutEffect(() => {
    wanted.current = scrollY;
  });
  useLayoutEffect(() => {
    if (results && container.current) container.current.scrollTop = wanted.current;
  }, [arrivalKey, results]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let queued = false;
    const onScrollEvent = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        onScroll(element.scrollTop);
      });
    };
    element.addEventListener('scroll', onScrollEvent, { passive: true });
    return () => element.removeEventListener('scroll', onScrollEvent);
  }, [onScroll, results]);

  if (error) {
    return (
      <Notice
        tone="error"
        title="The search failed"
        body={error}
        action={{ label: 'Try again', onClick: retry }}
      />
    );
  }
  if (loading || !results) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-stone-500">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Searching…
      </div>
    );
  }

  return (
    <div ref={container} className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-xl font-semibold text-stone-900">
          Results for <span className="text-teal-800">“{results.query}”</span>
        </h1>
        <p className="mt-1 text-sm text-stone-500" aria-live="polite">
          {results.results.length === 0
            ? 'No pages match.'
            : `${results.results.length} ${results.results.length === 1 ? 'page' : 'pages'}, best match first.`}
        </p>

        {results.results.length === 0 ? (
          <div className="mt-10 flex flex-col items-center text-center text-stone-500">
            <SearchX className="size-10 text-stone-300" aria-hidden />
            <p className="mt-3 max-w-sm text-sm">
              Nothing on the small web mentions that. Try fewer or different words — search looks at
              the whole text of every page, not just titles.
            </p>
          </div>
        ) : (
          <ol className="mt-6 space-y-6">
            {results.results.map((hit) => (
              <li key={hit.address}>
                <button
                  type="button"
                  onClick={() => onOpen(hit.address)}
                  className="group block w-full rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
                >
                  <span className="block font-mono text-xs text-stone-500">
                    {hit.address} · {hit.authorName}
                  </span>
                  <span className="mt-0.5 block text-lg font-medium text-teal-800 group-hover:underline">
                    {hit.title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-stone-600">
                    <Highlighted {...hit.snippet} />
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
