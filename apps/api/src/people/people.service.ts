import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { parseSession, type PersonDto, type SessionDto } from '@small-web/shared';
import type { Model } from 'mongoose';
import { MODEL, type PersonDoc, type SessionDoc } from '../db/schemas.js';

const MAX_SESSION_ENTRIES = 1000;

@Injectable()
export class PeopleService {
  constructor(
    @InjectModel(MODEL.Person) private readonly people: Model<PersonDoc>,
    @InjectModel(MODEL.Session) private readonly sessions: Model<SessionDoc>,
  ) {}

  async list(): Promise<PersonDto[]> {
    const people = await this.people.find().sort({ name: 1 }).lean();
    return people.map((person) => ({ id: person._id, name: person.name }));
  }

  async require(personId: string): Promise<PersonDoc> {
    const person = await this.people.findById(personId).lean();
    if (!person) throw new NotFoundException('No such person.');
    return person;
  }

  /** The saved back/forward stack, or an empty one. Stored data is re-validated on the way out. */
  async getSession(personId: string): Promise<SessionDto> {
    await this.require(personId);
    const doc = await this.sessions.findById(personId).lean();
    const session = doc ? parseSession({ entries: doc.entries, index: doc.index }) : null;
    return session ?? { entries: [], index: -1 };
  }

  async saveSession(personId: string, body: unknown): Promise<SessionDto> {
    await this.require(personId);
    const session = parseSession(body);
    if (!session) throw new BadRequestException('That is not a valid browser session.');
    if (session.entries.length > MAX_SESSION_ENTRIES) {
      throw new BadRequestException(`A session holds at most ${MAX_SESSION_ENTRIES} entries.`);
    }
    await this.sessions.findOneAndUpdate(
      { _id: personId },
      { $set: { entries: session.entries, index: session.index, updatedAt: new Date() } },
      { upsert: true },
    );
    return session;
  }
}
