import { describe, expect, it } from 'vitest';
import { buildSeed, SEED_ANCHOR } from './build.js';
import { DEAD_ADDRESSES } from './data.js';

const seed = buildSeed();
const siteIds = new Set(seed.sites.map((site) => site._id));
const linksIn = (html: string) => [...html.matchAll(/data-address="([^"]+)"/g)].map((m) => m[1]!);

describe('seed is deterministic', () => {
  it('builds identical data every time', () => {
    expect(JSON.stringify(buildSeed())).toBe(JSON.stringify(seed));
  });

  it('uses unique, stable ids so upserts never duplicate anything', () => {
    for (const docs of [seed.people, seed.sites, seed.revisions, seed.visits]) {
      const ids = docs.map((doc) => doc._id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    expect(seed.revisions.map((r) => r._id)).toEqual(seed.sites.map((s) => `${s._id}@1`));
  });
});

describe('the web', () => {
  it('has about ten sites and a handful of people', () => {
    expect(seed.sites).toHaveLength(10);
    expect(seed.people.length).toBeGreaterThanOrEqual(4);
  });

  it('has at least two authors with more than one site', () => {
    const counts = new Map<string, number>();
    for (const site of seed.sites) counts.set(site.authorId, (counts.get(site.authorId) ?? 0) + 1);
    expect([...counts.values()].filter((n) => n > 1).length).toBeGreaterThanOrEqual(2);
    for (const authorId of counts.keys()) expect(seed.people.map((p) => p._id)).toContain(authorId);
  });

  it('keeps every link through the sanitizer and points it at a real site or a dead end', () => {
    const dead = new Set(DEAD_ADDRESSES);
    for (const revision of seed.revisions) {
      const authored = [...revision.html.matchAll(/<a\s/g)].length;
      const links = linksIn(revision.sanitizedHtml);
      expect(links, revision._id).toHaveLength(authored);
      for (const link of links)
        expect(siteIds.has(link) || dead.has(link), `${revision._id} -> ${link}`).toBe(true);
    }
  });

  it('includes links to addresses that never existed', () => {
    const all = seed.revisions.flatMap((r) => linksIn(r.sanitizedHtml));
    const deadLinks = all.filter((link) => !siteIds.has(link));
    expect(new Set(deadLinks).size).toBeGreaterThanOrEqual(3);
    for (const address of DEAD_ADDRESSES) expect(siteIds.has(address)).toBe(false);
  });

  it('lets you wander: every site is reachable from the first one by following links', () => {
    const graph = new Map(seed.revisions.map((r) => [r.address, linksIn(r.sanitizedHtml)]));
    const seen = new Set(['tidepool.zz']);
    const queue = ['tidepool.zz'];
    while (queue.length > 0) {
      for (const next of graph.get(queue.shift()!) ?? []) {
        if (siteIds.has(next) && !seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    expect(seen.size).toBe(seed.sites.length);
  });

  it('gives search something to choose between: distinctive words live on exactly one site', () => {
    for (const word of [
      'anemones',
      'holdfast',
      'cordgrass',
      'herring',
      'neap',
      'fresnel',
      'cobalt',
      'bleached',
      'bowline',
      'barometer',
    ]) {
      const holders = seed.sites.filter((site) => site.text.toLowerCase().includes(word));
      expect(holders, word).toHaveLength(1);
    }
  });

  it('stores searchable text with no markup', () => {
    for (const site of seed.sites) {
      expect(site.text).not.toMatch(/[<>]/);
      expect(site.text.length).toBeGreaterThan(300);
    }
  });
});

describe('an hour of browsing history', () => {
  const hourStart = SEED_ANCHOR.getTime() - 60 * 60_000;
  const byPerson = (id: string) => seed.visits.filter((v) => v.personId === id);

  it('falls inside the hour before the anchor and is in order for each person', () => {
    for (const visit of seed.visits) {
      expect(visit.at.getTime()).toBeGreaterThanOrEqual(hourStart);
      expect(visit.at.getTime()).toBeLessThanOrEqual(SEED_ANCHOR.getTime());
    }
    for (const person of seed.people) {
      const times = byPerson(person._id).map((v) => v.at.getTime());
      expect(times).toEqual([...times].sort((a, b) => a - b));
    }
  });

  it('has someone who has been nearly everywhere, and a long trail', () => {
    const distinctSites = (id: string) =>
      new Set(
        byPerson(id)
          .filter((v) => v.status === 'shown')
          .map((v) => v.address),
      ).size;
    expect(Math.max(...seed.people.map((p) => distinctSites(p._id)))).toBeGreaterThanOrEqual(9);
    expect(Math.max(...seed.people.map((p) => byPerson(p._id).length))).toBeGreaterThanOrEqual(15);
  });

  it('has repeat visits, searches and visits to dead ends', () => {
    const repeats = seed.people.some((p) => {
      const addresses = byPerson(p._id)
        .map((v) => v.address)
        .filter(Boolean);
      return new Set(addresses).size < addresses.length;
    });
    expect(repeats).toBe(true);
    expect(seed.visits.some((v) => v.kind === 'search')).toBe(true);
    expect(seed.visits.some((v) => v.status === 'nowhere')).toBe(true);
  });

  it('only records a shown visit against a revision and title that exist', () => {
    const revisions = new Map(seed.revisions.map((r) => [r._id, r]));
    for (const visit of seed.visits.filter((v) => v.status === 'shown')) {
      const revision = revisions.get(visit.revisionId ?? '');
      expect(revision?.address).toBe(visit.address);
      expect(revision?.title).toBe(visit.title);
    }
    for (const visit of seed.visits.filter((v) => v.status === 'nowhere')) {
      expect(siteIds.has(visit.address ?? '')).toBe(false);
    }
  });
});
