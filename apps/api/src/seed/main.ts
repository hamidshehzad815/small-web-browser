import { createHash } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';
import {
  MODEL,
  personSchema,
  revisionSchema,
  siteSchema,
  visitSchema,
  type PersonDoc,
  type RevisionDoc,
  type SiteDoc,
  type VisitDoc,
} from '../db/schemas.js';
import { buildSeed, SEED_VISIT_ID } from './build.js';

// Standalone script (not part of the Nest app): `npm run seed`. Safe to run any number of times.

try {
  process.loadEnvFile('../../.env');
} catch {
  // No .env file: fall back to the shell environment / defaults below.
}

const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/small-web';

async function upsertAll<T extends { _id: string }>(model: Model<T>, docs: T[]) {
  await model.bulkWrite(
    docs.map((doc) => {
      const { _id, ...fields } = doc;
      return { updateOne: { filter: { _id }, update: { $set: fields }, upsert: true } };
    }) as never,
  );
}

async function main() {
  const seed = buildSeed();
  await mongoose.connect(uri);

  const People = mongoose.model<PersonDoc>(MODEL.Person, personSchema);
  const Sites = mongoose.model<SiteDoc>(MODEL.Site, siteSchema);
  const Revisions = mongoose.model<RevisionDoc>(MODEL.Revision, revisionSchema);
  const Visits = mongoose.model<VisitDoc>(MODEL.Visit, visitSchema);
  await Promise.all([People, Sites, Revisions, Visits].map((model) => model.init())); // build indexes

  await upsertAll(People, seed.people);
  await upsertAll(Sites, seed.sites);
  await upsertAll(Revisions, seed.revisions);
  // Seeded visits are replaced as a set, so editing the seed never leaves stale rows behind.
  // Visits made by real use have random ids and are left alone.
  await Visits.deleteMany({ _id: { $regex: SEED_VISIT_ID } });
  await upsertAll(Visits, seed.visits);

  const checksum = createHash('sha1').update(JSON.stringify(seed)).digest('hex').slice(0, 12);
  const counts = await Promise.all([
    People.countDocuments(),
    Sites.countDocuments(),
    Revisions.countDocuments(),
    Visits.countDocuments(),
  ]);
  console.log(
    `Seeded ${seed.people.length} people, ${seed.sites.length} sites, ${seed.visits.length} visits (checksum ${checksum}).`,
  );
  console.log(
    `Database now holds ${counts[0]} people, ${counts[1]} sites, ${counts[2]} revisions, ${counts[3]} visits.`,
  );
}

try {
  await main();
} finally {
  await mongoose.disconnect();
}
