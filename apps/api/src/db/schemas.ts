import { randomUUID } from 'node:crypto';
import type { Via } from '@small-web/shared';
import mongoose from 'mongoose';

// Plain schemas (no decorators) so the Nest app and the standalone seed script share them.
// String _ids are deliberate: they are derived from the address / person, which keeps seeding idempotent.
const { Schema } = mongoose;

export const MODEL = {
  Person: 'Person',
  Site: 'Site',
  Revision: 'SiteRevision',
  Visit: 'Visit',
  Session: 'BrowserSession',
} as const;

export interface PersonDoc {
  _id: string;
  name: string;
}

/** `_id` is the normalized address. `title`/`text` mirror the current revision, for search. */
export interface SiteDoc {
  _id: string;
  title: string;
  text: string;
  authorId: string;
  currentRevision: number;
  createdAt: Date;
}

/** `_id` is `<address>@<rev>`. Revisions are immutable: an edit adds one, so history can restore it. */
export interface RevisionDoc {
  _id: string;
  address: string;
  rev: number;
  title: string;
  html: string;
  sanitizedHtml: string;
  createdAt: Date;
}

/** Append-only. History is this log, newest first. */
export interface VisitDoc {
  _id: string;
  personId: string;
  at: Date;
  via: Via;
  kind: 'page' | 'search';
  address?: string;
  title?: string;
  status?: 'shown' | 'nowhere';
  revisionId?: string;
  query?: string;
}

/** The back/forward stack, one per person. `_id` is the person id. */
export interface SessionDoc {
  _id: string;
  entries: unknown[];
  index: number;
  updatedAt: Date;
}

const options = { versionKey: false } as const;

export const personSchema = new Schema<PersonDoc>(
  { _id: String, name: { type: String, required: true } },
  options,
);

export const siteSchema = new Schema<SiteDoc>(
  {
    _id: String,
    title: { type: String, required: true },
    text: { type: String, required: true },
    authorId: { type: String, required: true, index: true },
    currentRevision: { type: Number, required: true },
    createdAt: { type: Date, required: true },
  },
  options,
);
siteSchema.index(
  { title: 'text', text: 'text' },
  { weights: { title: 10, text: 1 }, name: 'site_text' },
);

export const revisionSchema = new Schema<RevisionDoc>(
  {
    _id: String,
    address: { type: String, required: true, index: true },
    rev: { type: Number, required: true },
    title: { type: String, required: true },
    html: { type: String, required: true },
    sanitizedHtml: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  options,
);

export const visitSchema = new Schema<VisitDoc>(
  {
    _id: { type: String, default: () => randomUUID() },
    personId: { type: String, required: true },
    at: { type: Date, required: true },
    via: { type: String, required: true },
    kind: { type: String, required: true },
    address: String,
    title: String,
    status: String,
    revisionId: String,
    query: String,
  },
  options,
);
visitSchema.index({ personId: 1, at: -1, _id: -1 });

export const sessionSchema = new Schema<SessionDoc>(
  {
    _id: String,
    entries: { type: [Schema.Types.Mixed], default: [] },
    index: { type: Number, required: true },
    updatedAt: { type: Date, required: true },
  },
  { ...options, minimize: false },
);
