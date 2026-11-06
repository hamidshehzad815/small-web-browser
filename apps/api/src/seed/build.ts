import { parseAddress } from '@small-web/shared';
import type { PersonDoc, RevisionDoc, SiteDoc, VisitDoc } from '../db/schemas.js';
import { prepareContent } from '../sites/content.js';
import { PEOPLE, SITES, TRAILS } from './data.js';

// The browsing hour ends here. A fixed instant (not "now") keeps every run identical, so the
// walk-through in a recording can be walked again.
export const SEED_ANCHOR = new Date('2026-11-01T12:00:00.000Z');
const MINUTE = 60_000;
const HOUR_START = SEED_ANCHOR.getTime() - 60 * MINUTE;
const SITES_CREATED_AT = new Date(SEED_ANCHOR.getTime() - 24 * 60 * MINUTE);

/** Seeded visit ids end in this, so a re-seed can replace them without touching real visits. */
export const SEED_VISIT_ID = /:seed-\d+$/;

export interface Seed {
  people: PersonDoc[];
  sites: SiteDoc[];
  revisions: RevisionDoc[];
  visits: VisitDoc[];
}

export function buildSeed(): Seed {
  const people: PersonDoc[] = PEOPLE.map((person) => ({ _id: person.id, name: person.name }));

  const sites: SiteDoc[] = [];
  const revisions: RevisionDoc[] = [];
  const titles = new Map<string, string>();
  for (const site of SITES) {
    const address = normalize(site.address);
    const { sanitizedHtml, text } = prepareContent(site.html.trim());
    titles.set(address, site.title);
    sites.push({
      _id: address,
      title: site.title,
      text,
      authorId: site.authorId,
      currentRevision: 1,
      createdAt: SITES_CREATED_AT,
    });
    revisions.push({
      _id: `${address}@1`,
      address,
      rev: 1,
      title: site.title,
      html: site.html.trim(),
      sanitizedHtml,
      createdAt: SITES_CREATED_AT,
    });
  }

  const visits: VisitDoc[] = [];
  for (const [personId, steps] of Object.entries(TRAILS)) {
    steps.forEach(([minute, via, target], index) => {
      const base = {
        _id: `${personId}:seed-${String(index).padStart(3, '0')}`,
        personId,
        at: new Date(HOUR_START + minute * MINUTE),
        via,
      };
      if (target.startsWith('?')) {
        visits.push({ ...base, kind: 'search', query: target.slice(1) });
        return;
      }
      const address = normalize(target);
      const title = titles.get(address);
      visits.push(
        title === undefined
          ? { ...base, kind: 'page', address, status: 'nowhere' }
          : { ...base, kind: 'page', address, status: 'shown', revisionId: `${address}@1`, title },
      );
    });
  }

  return { people, sites, revisions, visits };
}

function normalize(address: string): string {
  const parsed = parseAddress(address);
  if (!parsed.ok) throw new Error(`Seed contains an invalid address: ${address}`);
  return parsed.address;
}
