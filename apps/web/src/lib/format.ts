import type { HistoryEntry, Via, VisitDto } from '@small-web/shared';

/** What the address bar shows for the page we are on. */
export function addressBarText(entry: HistoryEntry | null): string {
  if (!entry) return '';
  return entry.kind === 'search' ? `search: ${entry.query}` : entry.address;
}

export const VIA_LABEL: Record<Via, string> = {
  typed: 'typed',
  link: 'link',
  search: 'from search',
  history: 'from history',
  back: 'back',
  forward: 'forward',
};

export const visitLabel = (visit: VisitDto): string =>
  visit.kind === 'search' ? `Search: ${visit.query ?? ''}` : (visit.title ?? visit.address ?? '');

export const dayLabel = (iso: string): string =>
  new Date(iso).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

export const timeLabel = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
