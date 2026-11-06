'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Address, PageShown } from '@small-web/shared';
import { parseBridgeMessage } from '@/lib/bridge';
import { buildViewerDocument, newNonce } from '@/lib/viewer-doc';

interface ViewerProps {
  page: PageShown;
  /** Where to scroll to once the page has loaded (the position it was left at). */
  scrollY: number;
  onNavigate: (address: Address) => void;
  onScroll: (scrollY: number) => void;
}

/**
 * The ONLY place site content is rendered. Mount it with a `key` that changes per arrival: every
 * document then gets a fresh nonce and a fresh iframe, so a late message from the previous page can
 * never be mistaken for the current one, and scroll is always restored from scratch.
 *
 * Containment (see lib/viewer-doc.ts for the document itself):
 *  - sandbox="allow-scripts" with NO allow-same-origin: the page runs in an opaque origin and cannot
 *    touch our DOM, cookies, storage or API. No popups, forms, modals or top-level navigation either.
 *  - the document carries a CSP that only lets our nonce'd bridge script run.
 *  - messages are accepted only from this iframe's window, tagged with this document's nonce, and the
 *    address inside is re-validated before we navigate to it.
 */
export function Viewer({ page, scrollY, onNavigate, onScroll }: ViewerProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [nonce] = useState(newNonce);
  const srcDoc = useMemo(() => buildViewerDocument({ html: page.html, nonce }), [page.html, nonce]);

  const scrollRef = useRef(scrollY);
  useEffect(() => {
    scrollRef.current = scrollY;
  });

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const frame = frameRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      const message = parseBridgeMessage(event.data, nonce);
      if (!message) return;
      switch (message.type) {
        case 'ready':
          // The iframe's origin is opaque, so '*' is the only possible target; the payload is a number.
          frame.contentWindow?.postMessage(
            { type: 'restore-scroll', nonce, y: scrollRef.current },
            '*',
          );
          break;
        case 'scroll':
          onScroll(message.y);
          break;
        case 'navigate':
          onNavigate(message.address);
          break;
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [nonce, onNavigate, onScroll]);

  return (
    <iframe
      ref={frameRef}
      title={`Page: ${page.title}`}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      srcDoc={srcDoc}
      className="block h-full w-full border-0 bg-white"
    />
  );
}
