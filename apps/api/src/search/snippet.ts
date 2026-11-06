import type { SnippetDto } from '@small-web/shared';

const SNIPPET_LENGTH = 180;
const LEAD_IN = 60;

/** Words worth highlighting: quoted phrases kept whole, negated terms (-word) dropped. */
export function queryTerms(query: string): string[] {
  const tokens = query.match(/-?"[^"]*"|\S+/g) ?? [];
  const terms = tokens
    .filter((token) => !token.startsWith('-'))
    .map((token) => token.replace(/"/g, '').trim().toLowerCase())
    .filter((term) => term.length > 0);
  return [...new Set(terms)];
}

export function makeSnippet(text: string, terms: string[]): SnippetDto {
  const lower = text.toLowerCase();
  let first = -1;
  for (const term of terms) {
    const at = lower.indexOf(term);
    if (at !== -1 && (first === -1 || at < first)) first = at;
  }

  let start = first === -1 ? 0 : Math.max(0, first - LEAD_IN);
  if (start > 0) {
    const space = text.indexOf(' ', start);
    if (space !== -1 && space < first) start = space + 1; // begin on a word boundary
  }
  const end = Math.min(text.length, start + SNIPPET_LENGTH);
  const prefix = start > 0 ? '… ' : '';
  const slice = text.slice(start, end);
  const snippet = prefix + slice + (end < text.length ? ' …' : '');

  const ranges = mergeRanges(findRanges(slice.toLowerCase(), terms)).map(
    ([from, to]): [number, number] => [from + prefix.length, to + prefix.length],
  );
  return { text: snippet, ranges };
}

function findRanges(haystack: string, terms: string[]): [number, number][] {
  const ranges: [number, number][] = [];
  for (const term of terms) {
    let from = haystack.indexOf(term);
    while (from !== -1) {
      ranges.push([from, from + term.length]);
      from = haystack.indexOf(term, from + term.length);
    }
  }
  return ranges;
}

function mergeRanges(ranges: [number, number][]): [number, number][] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: [number, number][] = [];
  for (const [from, to] of sorted) {
    const last = merged[merged.length - 1];
    if (last && from <= last[1]) last[1] = Math.max(last[1], to);
    else merged.push([from, to]);
  }
  return merged;
}
