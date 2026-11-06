'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  parseAddress,
  type NavigateVia,
  type PageShown,
  type PersonDto,
  type VisitDto,
} from '@small-web/shared';
import { Loader2, TriangleAlert, X } from 'lucide-react';
import { useBrowser } from '@/hooks/use-browser';
import { addressBarText } from '@/lib/format';
import { HistoryPanel } from './history-panel';
import { Notice } from './notice';
import { PageView } from './page-view';
import { PublishPanel } from './publish-panel';
import { SearchPage } from './search-page';
import { StartPage } from './start-page';
import { Toolbar } from './toolbar';

type Panel = 'history' | 'publish' | null;

interface BrowserProps {
  person: PersonDto;
  people: PersonDto[];
  onSwitchPerson: (personId: string) => void;
}

/** One person's browser window. Rendered with `key={person.id}`, so switching person starts clean. */
export function Browser({ person, people, onSwitchPerson }: BrowserProps) {
  const b = useBrowser(person.id);
  const { navigate, reload, back, forward, entry } = b;
  const [panel, setPanel] = useState<Panel>(null);
  const [publishKey, setPublishKey] = useState(0);
  const [publishAddress, setPublishAddress] = useState('');
  const [loadedTitle, setLoadedTitle] = useState<{ revisionId: string; title: string } | null>(
    null,
  );
  const addressRef = useRef<HTMLInputElement>(null);

  const addressText = addressBarText(entry);

  const openAddress = useCallback(
    (address: string, via: NavigateVia) => void navigate({ kind: 'page', address }, via),
    [navigate],
  );

  const onGo = useCallback(
    (typed: string): string | null => {
      // Pressing Enter on an untouched bar reloads, like any browser.
      if (typed === addressText && typed !== '') {
        reload();
        return null;
      }
      const parsed = parseAddress(typed);
      if (!parsed.ok) {
        return parsed.reason === 'empty'
          ? 'Type an address first.'
          : 'Addresses look like name.zz: letters, digits and hyphens, then .zz.';
      }
      openAddress(parsed.address, 'typed');
      return null;
    },
    [addressText, reload, openAddress],
  );

  const openVisit = useCallback(
    (visit: VisitDto) => {
      if (visit.kind === 'search' && visit.query) {
        void navigate({ kind: 'search', query: visit.query }, 'history');
      } else if (visit.address) {
        openAddress(visit.address, 'history');
      }
    },
    [navigate, openAddress],
  );

  const onPageLoaded = useCallback(
    (page: PageShown) =>
      setLoadedTitle((current) =>
        current?.revisionId === page.revisionId
          ? current
          : { revisionId: page.revisionId, title: page.title },
      ),
    [],
  );

  const openPublish = useCallback((address = '') => {
    setPublishAddress(address);
    setPublishKey((key) => key + 1);
    setPanel('publish');
  }, []);

  const onPublished = useCallback(
    (page: PageShown) => {
      b.forgetSearches();
      setPanel(null);
      openAddress(page.address, 'typed');
    },
    [b, openAddress],
  );

  // Keyboard: Alt+←/→ for history, Ctrl/Cmd+L for the address bar, Escape closes a panel.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        back();
      } else if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        forward();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        addressRef.current?.focus();
      } else if (event.key === 'Escape') {
        setPanel(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [back, forward]);

  // The tab title follows the page.
  const shownTitle =
    entry?.kind === 'page' &&
    entry.status === 'shown' &&
    loadedTitle?.revisionId === entry.revisionId
      ? loadedTitle.title
      : null;
  const title =
    entry === null
      ? null
      : entry.kind === 'search'
        ? `Search: ${entry.query}`
        : (shownTitle ?? entry.address);
  useEffect(() => {
    document.title = title ? `${title} · The Small Web` : 'The Small Web';
  }, [title]);

  const announcement =
    b.view === 'loading'
      ? 'Loading…'
      : b.view === 'error'
        ? `Error: ${b.state.error}`
        : b.view === 'nowhere'
          ? `No site lives at ${addressText}`
          : title
            ? `${title} loaded`
            : '';

  return (
    <div className="flex h-dvh flex-col">
      <Toolbar
        canBack={b.canBack}
        canForward={b.canForward}
        addressText={addressText}
        addressRef={addressRef}
        onGo={onGo}
        onSearch={(query) => void navigate({ kind: 'search', query }, 'typed')}
        onBack={back}
        onForward={forward}
        onReload={reload}
        people={people}
        personId={person.id}
        onSwitchPerson={onSwitchPerson}
        historyOpen={panel === 'history'}
        publishOpen={panel === 'publish'}
        onToggleHistory={() => setPanel(panel === 'history' ? null : 'history')}
        onTogglePublish={() => (panel === 'publish' ? setPanel(null) : openPublish())}
      />

      <div className="relative flex min-h-0 flex-1">
        <main id="content" className="relative flex min-w-0 flex-1 flex-col bg-white">
          {b.view === 'loading' && (
            <div
              role="progressbar"
              aria-label="Loading"
              className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-teal-100"
            >
              <div className="progress-bar h-full w-1/3 bg-teal-600" />
            </div>
          )}
          {b.state.error && b.view !== 'loading' && (
            <div
              role="alert"
              className="flex items-center gap-3 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800"
            >
              <TriangleAlert className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">{b.state.error}</span>
              <button type="button" onClick={b.retry} className="font-medium underline">
                Try again
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1">
            {!b.ready ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-stone-500">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Restoring {person.name}’s
                session…
              </div>
            ) : entry === null ? (
              <StartPage
                personId={person.id}
                personName={person.name}
                onOpen={(address) => openAddress(address, 'history')}
              />
            ) : entry.kind === 'search' ? (
              <SearchPage
                query={entry.query}
                arrivalKey={b.state.arrival?.id ?? 0}
                scrollY={entry.scrollY}
                searches={b.searches}
                onOpen={(address) => openAddress(address, 'search')}
                onScroll={b.scrolled}
              />
            ) : entry.status === 'nowhere' ? (
              <Notice
                tone="nowhere"
                title={`No site lives at ${entry.address}`}
                body="Nobody has published here yet — the link may be old, or the address mistyped. You can claim it yourself, or head back."
                action={{
                  label: 'Publish this address',
                  onClick: () => openPublish(entry.address),
                }}
                secondary={b.canBack ? [{ label: 'Go back', onClick: back }] : []}
              />
            ) : (
              <PageView
                revisionId={entry.revisionId}
                arrivalKey={b.state.arrival?.id ?? 0}
                scrollY={entry.scrollY}
                pages={b.pages}
                onNavigate={(address) => openAddress(address, 'link')}
                onScroll={b.scrolled}
                onLoaded={onPageLoaded}
              />
            )}
          </div>
          <p className="sr-only" aria-live="polite">
            {announcement}
          </p>
        </main>

        {panel && (
          <aside
            aria-label={panel === 'history' ? 'History' : 'Publish a page'}
            className="absolute inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col border-l border-stone-200 bg-white shadow-xl md:static md:w-96 md:max-w-none md:shadow-none"
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-stone-900">
                {panel === 'history' ? `History · ${person.name}` : 'Publish a page'}
              </h2>
              <button
                type="button"
                onClick={() => setPanel(null)}
                aria-label="Close panel"
                className="rounded-full p-1 text-stone-500 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-teal-700"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {panel === 'history' ? (
                <HistoryPanel
                  personId={person.id}
                  personName={person.name}
                  version={b.visitsVersion}
                  onOpen={openVisit}
                />
              ) : (
                <PublishPanel
                  key={publishKey}
                  people={people}
                  defaultAuthorId={person.id}
                  initialAddress={publishAddress}
                  onPublished={onPublished}
                />
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
