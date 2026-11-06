import type { Address } from './address';
import type { HistoryEntry, Via } from './history';

// Request/response shapes of the REST API, shared so the client and server cannot drift.

export interface PersonDto {
  id: string;
  name: string;
}

export interface PageShown {
  status: 'shown';
  address: Address;
  title: string;
  authorId: string;
  authorName: string;
  revisionId: string;
  revision: number;
  /** Already sanitized on the server. Only ever rendered inside the sandboxed viewer. */
  html: string;
}
export interface PageNowhere {
  status: 'nowhere';
  address: Address;
}
export type ResolveResponse = PageShown | PageNowhere;

export interface PublishRequest {
  address: string;
  title: string;
  html: string;
  authorId: string;
}

/** Highlight ranges are [start, end) offsets into `text`, so the client never needs raw HTML. */
export interface SnippetDto {
  text: string;
  ranges: [number, number][];
}
export interface SearchHit {
  address: Address;
  title: string;
  authorName: string;
  snippet: SnippetDto;
}
export interface SearchResponse {
  query: string;
  results: SearchHit[];
}

export interface VisitDto {
  id: string;
  at: string;
  via: Via;
  kind: 'page' | 'search';
  address?: Address;
  title?: string;
  status?: 'shown' | 'nowhere';
  revisionId?: string;
  query?: string;
}
export interface VisitPage {
  visits: VisitDto[];
  nextCursor: string | null;
}
export interface RecordVisitRequest {
  via: Via;
  entry: HistoryEntry;
}

export interface SessionDto {
  entries: HistoryEntry[];
  index: number;
}
