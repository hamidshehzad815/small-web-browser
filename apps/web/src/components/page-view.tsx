'use client';

import { useEffect } from 'react';
import type { Address, PageShown } from '@small-web/shared';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useCached } from '@/hooks/use-cached';
import { getRevision } from '@/lib/api';
import { Viewer } from './viewer';
import { Notice } from './notice';

interface PageViewProps {
  revisionId: string;
  /** Changes on every arrival, so each one gets its own sandboxed document. */
  arrivalKey: number;
  scrollY: number;
  pages: Map<string, PageShown>;
  onNavigate: (address: Address) => void;
  onScroll: (scrollY: number) => void;
  /** Tells the browser the page's title once it is known (for the tab title). Must be stable. */
  onLoaded: (page: PageShown) => void;
}

export function PageView({
  revisionId,
  arrivalKey,
  scrollY,
  pages,
  onNavigate,
  onScroll,
  onLoaded,
}: PageViewProps) {
  const { value: page, error, loading, retry } = useCached(revisionId, pages, getRevision);
  useEffect(() => {
    if (page) onLoaded(page);
  }, [page, onLoaded]);

  if (error) {
    return (
      <Notice
        tone="error"
        title="This page could not be loaded"
        body={error}
        action={{ label: 'Try again', onClick: retry }}
      />
    );
  }
  if (loading || !page) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-stone-500">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Loading page…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Our own chrome, outside the sandbox: makes the boundary between the browser and a page obvious. */}
      <div className="flex items-center gap-2 border-b border-stone-200 bg-stone-50 px-4 py-1.5 text-xs text-stone-600">
        <ShieldCheck className="size-3.5 shrink-0 text-teal-700" aria-hidden />
        <span className="truncate">
          <span className="font-medium text-stone-800">{page.title}</span> · by {page.authorName} ·
          revision {page.revision}
        </span>
        <span className="ml-auto hidden shrink-0 sm:inline">shown in a sandbox</span>
      </div>
      <div className="min-h-0 flex-1">
        <Viewer
          key={`${arrivalKey}:${page.revisionId}`}
          page={page}
          scrollY={scrollY}
          onNavigate={onNavigate}
          onScroll={onScroll}
        />
      </div>
    </div>
  );
}
