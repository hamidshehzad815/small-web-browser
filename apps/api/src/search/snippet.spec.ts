import { describe, expect, it } from 'vitest';
import { makeSnippet, queryTerms } from './snippet.js';

describe('queryTerms', () => {
  it.each([
    ['tide pool', ['tide', 'pool']],
    ['  Tide   POOL ', ['tide', 'pool']],
    ['"hermit crab" shell', ['hermit crab', 'shell']],
    ['kelp -urchin', ['kelp']],
    ['tide tide', ['tide']],
    ['', []],
  ])('%j -> %j', (query, expected) => {
    expect(queryTerms(query)).toEqual(expected);
  });
});

describe('makeSnippet', () => {
  const long = `${'Intro words. '.repeat(20)}The anemone folds its tentacles at low tide. ${'Outro words. '.repeat(20)}`;

  it('centres the window on the first match and marks ellipses', () => {
    const { text, ranges } = makeSnippet(long, ['anemone']);
    expect(text.startsWith('… ')).toBe(true);
    expect(text.endsWith(' …')).toBe(true);
    expect(text).toContain('anemone');
    expect(ranges).toHaveLength(1);
    const [from, to] = ranges[0]!;
    expect(text.slice(from, to)).toBe('anemone');
  });

  it('highlights every occurrence of every term, case-insensitively', () => {
    const { text, ranges } = makeSnippet('Tide and tide, then Pool.', ['tide', 'pool']);
    expect(ranges.map(([a, b]) => text.slice(a, b))).toEqual(['Tide', 'tide', 'Pool']);
  });

  it('merges overlapping highlights', () => {
    const { text, ranges } = makeSnippet('sea glass', ['sea gl', 'glass']);
    expect(ranges).toHaveLength(1);
    expect(text.slice(ranges[0]![0], ranges[0]![1])).toBe('sea glass');
  });

  it('falls back to the start of the text, without highlights, when the match was only by stemming', () => {
    const { text, ranges } = makeSnippet('Anemones cling to the rock.', ['anemone-ish']);
    expect(text).toBe('Anemones cling to the rock.');
    expect(ranges).toEqual([]);
  });

  it('does not add ellipses to short text', () => {
    expect(makeSnippet('short text', ['short']).text).toBe('short text');
  });

  it('starts on a word boundary, not mid-word', () => {
    const { text } = makeSnippet(`${'abcdefghij '.repeat(30)}target ${'z'.repeat(50)}`, ['target']);
    expect(
      text.replace(/^… /, '').startsWith('abcdefghij') ||
        text.replace(/^… /, '').startsWith('target'),
    ).toBe(true);
  });
});
