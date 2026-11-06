import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { parseEntry, type VisitDto, type VisitPage } from '@small-web/shared';
import type { Model } from 'mongoose';
import { storedAddress } from '../common/mongo.js';
import { MODEL, type RevisionDoc, type VisitDoc } from '../db/schemas.js';
import { PeopleService } from './people.service.js';
import type { RecordVisitDto } from './people.dto.js';

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel(MODEL.Visit) private readonly visits: Model<VisitDoc>,
    @InjectModel(MODEL.Revision) private readonly revisions: Model<RevisionDoc>,
    private readonly people: PeopleService,
  ) {}

  /** Record an arrival. The server decides the time and looks up the title; the client is not trusted for either. */
  async record(personId: string, dto: RecordVisitDto): Promise<VisitDto> {
    await this.people.require(personId);

    const entry = parseEntry({ ...dto.entry, scrollY: 0 });
    if (!entry) throw new BadRequestException('That is not a valid history entry.');

    const doc: Omit<VisitDoc, '_id'> = { personId, at: new Date(), via: dto.via, kind: entry.kind };
    if (entry.kind === 'search') {
      doc.query = entry.query;
    } else {
      doc.address = entry.address;
      doc.status = entry.status;
      if (entry.status === 'shown') {
        const revision = await this.revisions.findById(entry.revisionId).lean();
        if (!revision || revision.address !== entry.address) {
          throw new BadRequestException('That revision does not belong to that address.');
        }
        doc.revisionId = revision._id;
        doc.title = revision.title;
      }
    }

    const created = await this.visits.create(doc);
    return toDto(created.toObject());
  }

  /** Newest first, keyset-paged so repeated visits and equal timestamps never skip or duplicate. */
  async list(personId: string, limit: number, cursor: string | undefined): Promise<VisitPage> {
    await this.people.require(personId);

    const filter: Record<string, unknown> = { personId };
    if (cursor !== undefined) {
      const { at, id } = parseCursor(cursor);
      filter.$or = [{ at: { $lt: at } }, { at, _id: { $lt: id } }];
    }

    const rows = await this.visits
      .find(filter)
      .sort({ at: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    const nextCursor = rows.length > limit && last ? `${last.at.toISOString()}|${last._id}` : null;
    return { visits: page.map(toDto), nextCursor };
  }
}

function parseCursor(cursor: string): { at: Date; id: string } {
  const split = cursor.indexOf('|');
  const at = new Date(cursor.slice(0, split));
  const id = cursor.slice(split + 1);
  if (split === -1 || Number.isNaN(at.getTime()) || id === '')
    throw new BadRequestException('Invalid cursor.');
  return { at, id };
}

function toDto(visit: VisitDoc): VisitDto {
  const dto: VisitDto = {
    id: visit._id,
    at: visit.at.toISOString(),
    via: visit.via,
    kind: visit.kind,
  };
  if (visit.address !== undefined) dto.address = storedAddress(visit.address);
  if (visit.title !== undefined) dto.title = visit.title;
  if (visit.status !== undefined) dto.status = visit.status;
  if (visit.revisionId !== undefined) dto.revisionId = visit.revisionId;
  if (visit.query !== undefined) dto.query = visit.query;
  return dto;
}
