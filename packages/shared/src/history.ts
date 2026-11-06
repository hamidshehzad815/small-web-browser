import { parseAddress, type Address } from './address';

// The back/forward stack for one person. Pure and framework-free: the UI feeds it actions and renders
// the state. Visits (the history log) are a side effect the UI records when `arrival` changes.

export type Via = 'typed' | 'link' | 'search' | 'history' | 'back' | 'forward';
export type NavigateVia = Exclude<Via, 'back' | 'forward'>;

export type PageEntry =
  | { kind: 'page'; address: Address; status: 'shown'; revisionId: string; scrollY: number }
  | { kind: 'page'; address: Address; status: 'nowhere'; revisionId: null; scrollY: number };
export interface SearchEntry {
  kind: 'search';
  query: string;
  scrollY: number;
}
export type HistoryEntry = PageEntry | SearchEntry;

export interface Arrival {
  id: number;
  via: Via;
  entry: HistoryEntry;
}

export interface BrowserState {
  readonly entries: readonly HistoryEntry[];
  /** -1 when there are no entries. */
  readonly index: number;
  /** The navigation in flight; a result for any other token is stale and ignored. */
  readonly pending: { readonly token: number; readonly via: NavigateVia } | null;
  readonly error: string | null;
  /** Set on every arrival at an entry; the UI records one visit per new value. */
  readonly arrival: Arrival | null;
  readonly arrivalSeq: number;
}

export type BrowserAction =
  | { type: 'begin'; token: number; via: NavigateVia }
  | { type: 'resolve'; token: number; entry: HistoryEntry }
  | { type: 'fail'; token: number; message: string }
  | { type: 'scrolled'; scrollY: number }
  | { type: 'back' }
  | { type: 'forward' }
  /** Swap in a persisted session (e.g. when switching person). Untrusted input; invalid resets. */
  | { type: 'restore'; session: unknown };

export const initialBrowserState: BrowserState = {
  entries: [],
  index: -1,
  pending: null,
  error: null,
  arrival: null,
  arrivalSeq: 0,
};

export function browserReducer(state: BrowserState, action: BrowserAction): BrowserState {
  switch (action.type) {
    case 'begin':
      return { ...state, pending: { token: action.token, via: action.via }, error: null };

    case 'resolve': {
      const { pending } = state;
      if (!pending || pending.token !== action.token) return state;
      const entry: HistoryEntry = { ...action.entry, scrollY: 0 };
      const current = state.entries[state.index];
      if (current && isSameTarget(current, entry)) {
        // Same address/query again is a reload: refresh in place instead of stacking a duplicate.
        const entries = state.entries.map((e, i) => (i === state.index ? entry : e));
        return arrive(state, entries, state.index, entry, pending.via);
      }
      // Navigating from the middle of the stack discards the forward entries.
      const entries = [...state.entries.slice(0, state.index + 1), entry];
      return arrive(state, entries, entries.length - 1, entry, pending.via);
    }

    case 'fail':
      if (!state.pending || state.pending.token !== action.token) return state;
      return { ...state, pending: null, error: action.message };

    case 'scrolled': {
      const current = state.entries[state.index];
      if (!current) return state;
      const scrollY = Number.isFinite(action.scrollY) ? Math.max(0, Math.round(action.scrollY)) : 0;
      if (current.scrollY === scrollY) return state;
      const entries = state.entries.map((e, i) => (i === state.index ? { ...e, scrollY } : e));
      return { ...state, entries };
    }

    case 'back':
      return move(state, state.index - 1, 'back');
    case 'forward':
      return move(state, state.index + 1, 'forward');

    case 'restore': {
      const session = parseSession(action.session);
      return { ...initialBrowserState, arrivalSeq: state.arrivalSeq, ...session };
    }
  }
}

function arrive(
  state: BrowserState,
  entries: readonly HistoryEntry[],
  index: number,
  entry: HistoryEntry,
  via: Via,
): BrowserState {
  const arrivalSeq = state.arrivalSeq + 1;
  return {
    entries,
    index,
    pending: null,
    error: null,
    arrival: { id: arrivalSeq, via, entry },
    arrivalSeq,
  };
}

function move(state: BrowserState, to: number, via: 'back' | 'forward'): BrowserState {
  const entry = state.entries[to];
  if (!entry) return state;
  // Moving cancels any navigation in flight so its late result cannot land on the wrong entry.
  return arrive(state, state.entries, to, entry, via);
}

function isSameTarget(a: HistoryEntry, b: HistoryEntry): boolean {
  if (a.kind === 'page' && b.kind === 'page') return a.address === b.address;
  if (a.kind === 'search' && b.kind === 'search') return a.query === b.query;
  return false;
}

export const currentEntry = (state: BrowserState): HistoryEntry | null =>
  state.entries[state.index] ?? null;
export const canBack = (state: BrowserState): boolean => state.index > 0;
export const canForward = (state: BrowserState): boolean =>
  state.index >= 0 && state.index < state.entries.length - 1;

export type ViewState = 'idle' | 'loading' | 'shown' | 'nowhere' | 'error';

export function viewState(state: BrowserState): ViewState {
  if (state.pending) return 'loading';
  if (state.error) return 'error';
  const current = currentEntry(state);
  if (!current) return 'idle';
  return current.kind === 'page' && current.status === 'nowhere' ? 'nowhere' : 'shown';
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function parseEntry(raw: unknown): HistoryEntry | null {
  if (!isRecord(raw)) return null;
  const { scrollY } = raw;
  if (typeof scrollY !== 'number' || !Number.isFinite(scrollY) || scrollY < 0) return null;

  if (raw.kind === 'search') {
    if (typeof raw.query !== 'string' || raw.query.trim() === '') return null;
    return { kind: 'search', query: raw.query, scrollY: Math.round(scrollY) };
  }

  if (raw.kind === 'page') {
    const parsed = typeof raw.address === 'string' ? parseAddress(raw.address) : null;
    if (!parsed || !parsed.ok) return null;
    const { address } = parsed;
    if (raw.status === 'shown' && typeof raw.revisionId === 'string' && raw.revisionId !== '') {
      return {
        kind: 'page',
        address,
        status: 'shown',
        revisionId: raw.revisionId,
        scrollY: Math.round(scrollY),
      };
    }
    if (raw.status === 'nowhere' && raw.revisionId === null) {
      return {
        kind: 'page',
        address,
        status: 'nowhere',
        revisionId: null,
        scrollY: Math.round(scrollY),
      };
    }
  }
  return null;
}

export function parseSession(raw: unknown): { entries: HistoryEntry[]; index: number } | null {
  if (!isRecord(raw) || !Array.isArray(raw.entries)) return null;
  const entries: HistoryEntry[] = [];
  for (const item of raw.entries) {
    const entry = parseEntry(item);
    if (!entry) return null;
    entries.push(entry);
  }
  const { index } = raw;
  if (entries.length === 0) return index === -1 ? { entries, index: -1 } : null;
  if (typeof index !== 'number' || !Number.isInteger(index)) return null;
  if (index < 0 || index >= entries.length) return null;
  return { entries, index };
}
