import { describe, expect, it } from 'vitest';
import { parseAddress, type Address } from './address';
import {
  browserReducer,
  canBack,
  canForward,
  currentEntry,
  initialBrowserState,
  parseSession,
  viewState,
  type BrowserAction,
  type BrowserState,
  type HistoryEntry,
  type NavigateVia,
} from './history';

const addr = (input: string): Address => {
  const parsed = parseAddress(input);
  if (!parsed.ok) throw new Error(`bad test address: ${input}`);
  return parsed.address;
};
const page = (address: string, revisionId = 'r1'): HistoryEntry => ({
  kind: 'page',
  address: addr(address),
  status: 'shown',
  revisionId,
  scrollY: 0,
});
const nowhere = (address: string): HistoryEntry => ({
  kind: 'page',
  address: addr(address),
  status: 'nowhere',
  revisionId: null,
  scrollY: 0,
});
const search = (query: string): HistoryEntry => ({ kind: 'search', query, scrollY: 0 });

let nextToken = 0;
const run = (state: BrowserState, ...actions: BrowserAction[]): BrowserState =>
  actions.reduce((s, a) => browserReducer(s, a), state);
const go = (state: BrowserState, entry: HistoryEntry, via: NavigateVia = 'link') => {
  nextToken += 1;
  return run(
    state,
    { type: 'begin', token: nextToken, via },
    { type: 'resolve', token: nextToken, entry },
  );
};
const trail = (...addresses: string[]) =>
  addresses.reduce((s, a) => go(s, page(a)), initialBrowserState);
const where = (state: BrowserState): string | null => {
  const entry = currentEntry(state);
  if (!entry) return null;
  return entry.kind === 'page' ? entry.address : `search:${entry.query}`;
};
const stack = (state: BrowserState) =>
  state.entries.map((e) => (e.kind === 'page' ? e.address : `search:${e.query}`));

describe('navigation', () => {
  it('starts empty and idle with nothing to go back or forward to', () => {
    const s = initialBrowserState;
    expect(canBack(s)).toBe(false);
    expect(canForward(s)).toBe(false);
    expect(viewState(s)).toBe('idle');
    expect(currentEntry(s)).toBeNull();
  });

  it('a trail four deep ends on the last page with back enabled and forward disabled', () => {
    const s = trail('a.zz', 'b.zz', 'c.zz', 'd.zz');
    expect(stack(s)).toEqual(['a.zz', 'b.zz', 'c.zz', 'd.zz']);
    expect(where(s)).toBe('d.zz');
    expect([canBack(s), canForward(s)]).toEqual([true, false]);
    expect(viewState(s)).toBe('shown');
  });

  it('back x2 then forward x1 lands on the right entry without changing the stack', () => {
    const deep = trail('a.zz', 'b.zz', 'c.zz', 'd.zz');
    const s = run(deep, { type: 'back' }, { type: 'back' }, { type: 'forward' });
    expect(where(s)).toBe('c.zz');
    expect(stack(s)).toEqual(stack(deep));
    expect([canBack(s), canForward(s)]).toEqual([true, true]);
  });

  it('navigating from the middle discards the forward entries', () => {
    const s = go(
      run(trail('a.zz', 'b.zz', 'c.zz', 'd.zz'), { type: 'back' }, { type: 'back' }),
      page('x.zz'),
    );
    expect(stack(s)).toEqual(['a.zz', 'b.zz', 'x.zz']);
    expect(canForward(s)).toBe(false);
  });

  it('back at the start and forward at the end are no-ops that record no arrival', () => {
    const one = trail('a.zz');
    expect(run(one, { type: 'back' })).toBe(one);
    expect(run(one, { type: 'forward' })).toBe(one);
    expect(run(initialBrowserState, { type: 'back' })).toBe(initialBrowserState);
  });

  it('records one arrival per navigation, tagged with how we got there', () => {
    let s = go(initialBrowserState, page('a.zz'), 'typed');
    expect(s.arrival).toMatchObject({ id: 1, via: 'typed' });
    s = go(s, page('b.zz'), 'link');
    expect(s.arrival).toMatchObject({ id: 2, via: 'link' });
    s = run(s, { type: 'back' });
    expect(s.arrival).toMatchObject({ id: 3, via: 'back', entry: { address: 'a.zz' } });
    s = run(s, { type: 'forward' });
    expect(s.arrival).toMatchObject({ id: 4, via: 'forward', entry: { address: 'b.zz' } });
  });

  it('typing the current address reloads in place instead of stacking a duplicate', () => {
    let s = trail('a.zz', 'b.zz');
    s = go(s, page('b.zz', 'r2'), 'typed');
    expect(stack(s)).toEqual(['a.zz', 'b.zz']);
    expect(currentEntry(s)).toMatchObject({ revisionId: 'r2' });
    expect(s.arrival).toMatchObject({ via: 'typed' }); // still counts as a visit
    expect(where(run(s, { type: 'back' }))).toBe('a.zz'); // one Back click leaves the page
  });
});

describe('nowhere', () => {
  it('is an ordinary stack entry that back and forward move across', () => {
    let s = go(trail('a.zz'), nowhere('ghost.zz'));
    s = go(s, page('c.zz'));
    expect(viewState(run(s, { type: 'back' }))).toBe('nowhere');
    expect(where(run(s, { type: 'back' }))).toBe('ghost.zz');
    expect(where(run(s, { type: 'back' }, { type: 'back' }))).toBe('a.zz');
    expect(viewState(run(s, { type: 'back' }, { type: 'back' }, { type: 'forward' }))).toBe(
      'nowhere',
    );
  });

  it('stays nowhere on return even if the address is later published', () => {
    let s = go(trail('a.zz'), nowhere('ghost.zz'));
    s = go(s, page('c.zz'));
    // ghost.zz gets published; a fresh visit would show it, but the old entry is "the page that was left".
    s = run(s, { type: 'back' });
    expect(currentEntry(s)).toMatchObject({ status: 'nowhere', revisionId: null });
  });
});

describe('restore on return', () => {
  it('returns to the revision that was shown, even after the page was republished', () => {
    let s = go(initialBrowserState, page('a.zz', 'r1'));
    s = go(s, page('b.zz'));
    s = go(s, page('a.zz', 'r2')); // a.zz republished meanwhile; a fresh visit gets r2
    s = run(s, { type: 'back' }, { type: 'back' });
    expect(currentEntry(s)).toMatchObject({ address: 'a.zz', revisionId: 'r1' });
    s = run(s, { type: 'forward' }, { type: 'forward' });
    expect(currentEntry(s)).toMatchObject({ address: 'a.zz', revisionId: 'r2' });
  });

  it('keeps each entry’s scroll position across back and forward', () => {
    let s = trail('a.zz', 'b.zz');
    s = run(s, { type: 'scrolled', scrollY: 480 }); // reading b.zz
    s = run(s, { type: 'back' });
    expect(currentEntry(s)?.scrollY).toBe(0);
    s = run(s, { type: 'scrolled', scrollY: 120 }, { type: 'forward' });
    expect(currentEntry(s)?.scrollY).toBe(480);
    s = run(s, { type: 'back' });
    expect(currentEntry(s)?.scrollY).toBe(120);
  });

  it('starts a new navigation at the top', () => {
    const s = go(run(trail('a.zz'), { type: 'scrolled', scrollY: 900 }), page('b.zz'));
    expect(currentEntry(s)?.scrollY).toBe(0);
  });

  it('rounds and clamps scroll, and ignores unchanged or non-finite values', () => {
    const s = trail('a.zz');
    expect(currentEntry(run(s, { type: 'scrolled', scrollY: 10.6 }))?.scrollY).toBe(11);
    expect(currentEntry(run(s, { type: 'scrolled', scrollY: -50 }))?.scrollY).toBe(0);
    expect(currentEntry(run(s, { type: 'scrolled', scrollY: Number.NaN }))?.scrollY).toBe(0);
    expect(run(s, { type: 'scrolled', scrollY: 0 })).toBe(s);
    expect(run(initialBrowserState, { type: 'scrolled', scrollY: 5 })).toBe(initialBrowserState);
  });
});

describe('search results are a stack entry', () => {
  it('search, open a result, go back: same query, same scroll', () => {
    let s = go(trail('home.zz'), search('tide'), 'typed');
    s = run(s, { type: 'scrolled', scrollY: 640 });
    s = go(s, page('tidepool.zz'), 'search');
    expect(s.arrival).toMatchObject({ via: 'search' });
    s = run(s, { type: 'back' });
    expect(currentEntry(s)).toMatchObject({ kind: 'search', query: 'tide', scrollY: 640 });
  });

  it('submitting the same query again refreshes in place', () => {
    const s = go(go(trail('home.zz'), search('tide'), 'typed'), search('tide'), 'typed');
    expect(stack(s)).toEqual(['home.zz', 'search:tide']);
  });

  it('a different query is a new entry', () => {
    const s = go(go(trail('home.zz'), search('tide'), 'typed'), search('kelp'), 'typed');
    expect(stack(s)).toEqual(['home.zz', 'search:tide', 'search:kelp']);
  });
});

describe('loading races', () => {
  it('ignores a stale result when a newer navigation has started', () => {
    const base = trail('a.zz');
    const s = run(
      base,
      { type: 'begin', token: 100, via: 'typed' },
      { type: 'begin', token: 101, via: 'link' },
    );
    expect(viewState(s)).toBe('loading');
    const stale = run(s, { type: 'resolve', token: 100, entry: page('slow.zz') });
    expect(stale).toBe(s);
    const fresh = run(s, { type: 'resolve', token: 101, entry: page('fast.zz') });
    expect(where(fresh)).toBe('fast.zz');
    expect(fresh.arrival).toMatchObject({ via: 'link' });
    expect(viewState(fresh)).toBe('shown');
  });

  it('back cancels the navigation in flight so its late result is dropped', () => {
    const afterBack = run(
      trail('a.zz', 'b.zz'),
      { type: 'begin', token: 200, via: 'link' },
      { type: 'back' },
    );
    expect(afterBack.pending).toBeNull();
    expect(run(afterBack, { type: 'resolve', token: 200, entry: page('late.zz') })).toBe(afterBack);
    expect(where(afterBack)).toBe('a.zz');
  });

  it('surfaces a failure, keeps the stack, and clears the error on the next attempt', () => {
    const before = trail('a.zz');
    let s = run(before, { type: 'begin', token: 300, via: 'typed' });
    expect(run(s, { type: 'fail', token: 299, message: 'old' })).toBe(s);
    s = run(s, { type: 'fail', token: 300, message: 'API unreachable' });
    expect(viewState(s)).toBe('error');
    expect(s.error).toBe('API unreachable');
    expect(stack(s)).toEqual(['a.zz']);
    s = run(s, { type: 'begin', token: 301, via: 'typed' });
    expect(s.error).toBeNull();
  });
});

describe('sessions per person', () => {
  it('switching person swaps the whole stack and never leaks the other one', () => {
    const mara = trail('a.zz', 'b.zz');
    const dev = trail('x.zz');
    const asDev = run(mara, {
      type: 'restore',
      session: { entries: dev.entries, index: dev.index },
    });
    expect(stack(asDev)).toEqual(['x.zz']);
    expect(asDev.pending).toBeNull();
    expect(asDev.arrival).toBeNull(); // restoring is not a new visit
    expect(stack(mara)).toEqual(['a.zz', 'b.zz']);
  });

  it('drops a navigation in flight when the session is swapped', () => {
    const s = run(trail('a.zz'), { type: 'begin', token: 400, via: 'link' });
    const swapped = run(s, { type: 'restore', session: { entries: [], index: -1 } });
    expect(run(swapped, { type: 'resolve', token: 400, entry: page('b.zz') })).toBe(swapped);
  });

  it('resets to empty on an invalid session but keeps arrival ids increasing', () => {
    const mara = trail('a.zz', 'b.zz');
    const reset = run(mara, {
      type: 'restore',
      session: { entries: [{ kind: 'nope' }], index: 0 },
    });
    expect(reset.entries).toEqual([]);
    expect(reset.index).toBe(-1);
    expect(reset.arrivalSeq).toBe(mara.arrivalSeq);
    expect(go(reset, page('c.zz')).arrival?.id).toBe(mara.arrivalSeq + 1);
  });
});

describe('parseSession', () => {
  const good = { kind: 'page', address: 'a.zz', status: 'shown', revisionId: 'r1', scrollY: 0 };

  it('accepts a valid session and normalizes addresses', () => {
    const parsed = parseSession({ entries: [{ ...good, address: 'HTTP://A.zz/' }], index: 0 });
    expect(parsed?.entries[0]).toMatchObject({ address: 'a.zz' });
  });

  it('accepts an empty session only with index -1', () => {
    expect(parseSession({ entries: [], index: -1 })).toEqual({ entries: [], index: -1 });
    expect(parseSession({ entries: [], index: 0 })).toBeNull();
  });

  it.each([
    ['not an object', 'nope'],
    ['no entries', { index: 0 }],
    ['index out of range', { entries: [good], index: 1 }],
    ['negative index', { entries: [good], index: -1 }],
    ['fractional index', { entries: [good, good], index: 0.5 }],
    ['unknown kind', { entries: [{ ...good, kind: 'frame' }], index: 0 }],
    ['bad address', { entries: [{ ...good, address: 'javascript:alert(1)' }], index: 0 }],
    ['shown without a revision', { entries: [{ ...good, revisionId: '' }], index: 0 }],
    ['nowhere with a revision', { entries: [{ ...good, status: 'nowhere' }], index: 0 }],
    ['negative scroll', { entries: [{ ...good, scrollY: -1 }], index: 0 }],
    ['blank search query', { entries: [{ kind: 'search', query: '  ', scrollY: 0 }], index: 0 }],
  ])('rejects %s', (_label, raw) => {
    expect(parseSession(raw)).toBeNull();
  });
});
