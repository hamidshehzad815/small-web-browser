import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { parseAddress, type PageShown, type ResolveResponse } from '@small-web/shared';
import type { Model } from 'mongoose';
import { isDuplicateKey, storedAddress } from '../common/mongo.js';
import { MODEL, type PersonDoc, type RevisionDoc, type SiteDoc } from '../db/schemas.js';
import { prepareContent } from './content.js';
import type { PublishDto } from './sites.dto.js';

@Injectable()
export class SitesService {
  constructor(
    @InjectModel(MODEL.Site) private readonly sites: Model<SiteDoc>,
    @InjectModel(MODEL.Revision) private readonly revisions: Model<RevisionDoc>,
    @InjectModel(MODEL.Person) private readonly people: Model<PersonDoc>,
  ) {}

  /** The current revision of whatever lives at an address, or "nowhere" if nothing does. */
  async resolve(input: string): Promise<ResolveResponse> {
    const parsed = parseAddress(input);
    if (!parsed.ok) throw new BadRequestException(addressProblem(parsed.reason));

    const site = await this.sites.findById(parsed.address).lean();
    if (!site) return { status: 'nowhere', address: parsed.address };

    const revision = await this.revisions.findById(`${site._id}@${site.currentRevision}`).lean();
    if (!revision) throw new Error(`Site ${site._id} points at a missing revision`);
    return this.toShown(site, revision);
  }

  /** A specific revision, so back/forward can show the page exactly as it was left. */
  async getRevision(revisionId: string): Promise<PageShown> {
    const revision = await this.revisions.findById(revisionId).lean();
    if (!revision) throw new NotFoundException('No such revision.');
    const site = await this.sites.findById(revision.address).lean();
    if (!site) throw new NotFoundException('No such site.');
    return this.toShown(site, revision);
  }

  async publish(dto: PublishDto): Promise<PageShown> {
    const parsed = parseAddress(dto.address);
    if (!parsed.ok) throw new BadRequestException(addressProblem(parsed.reason));
    const address = parsed.address;

    const title = dto.title.trim();
    if (title === '') throw new BadRequestException('A title is required.');
    if (dto.html.trim() === '') throw new BadRequestException('The page needs some content.');

    const author = await this.people.findById(dto.authorId).lean();
    if (!author) throw new BadRequestException('Choose who is publishing.');

    const content = prepareContent(dto.html);
    if (content.text === '') {
      throw new BadRequestException(
        'The page has no readable text once unsupported markup is removed.',
      );
    }

    const existing = await this.sites.findById(address).lean();
    if (existing && existing.authorId !== author._id) {
      throw new ConflictException(`${address} already belongs to someone else.`);
    }

    const rev = existing ? existing.currentRevision + 1 : 1;
    const createdAt = new Date();
    const revision: RevisionDoc = {
      _id: `${address}@${rev}`,
      address,
      rev,
      title,
      html: dto.html,
      sanitizedHtml: content.sanitizedHtml,
      createdAt,
    };

    try {
      await this.revisions.create(revision);
    } catch (error) {
      if (isDuplicateKey(error))
        throw new ConflictException('Someone published here at the same moment. Try again.');
      throw error;
    }

    const site = await this.saveSite(existing, {
      address,
      title,
      text: content.text,
      authorId: author._id,
      rev,
      createdAt,
    });
    if (!site) {
      await this.revisions.deleteOne({ _id: revision._id }); // don't leave an orphan blocking the next publish
      throw new ConflictException('Someone published here at the same moment. Try again.');
    }
    return this.toShown(site, revision);
  }

  private async saveSite(
    existing: SiteDoc | null,
    next: {
      address: string;
      title: string;
      text: string;
      authorId: string;
      rev: number;
      createdAt: Date;
    },
  ): Promise<SiteDoc | null> {
    if (existing) {
      // Optimistic check on the revision number we built on: a concurrent publish makes this a no-op.
      return this.sites
        .findOneAndUpdate(
          { _id: next.address, currentRevision: existing.currentRevision },
          { $set: { title: next.title, text: next.text, currentRevision: next.rev } },
          { new: true },
        )
        .lean();
    }
    try {
      const created = await this.sites.create({
        _id: next.address,
        title: next.title,
        text: next.text,
        authorId: next.authorId,
        currentRevision: 1,
        createdAt: next.createdAt,
      });
      return created.toObject();
    } catch (error) {
      if (isDuplicateKey(error)) return null;
      throw error;
    }
  }

  private async toShown(site: SiteDoc, revision: RevisionDoc): Promise<PageShown> {
    const author = await this.people.findById(site.authorId).lean();
    return {
      status: 'shown',
      address: storedAddress(site._id),
      title: revision.title,
      authorId: site.authorId,
      authorName: author?.name ?? 'Unknown',
      revisionId: revision._id,
      revision: revision.rev,
      html: revision.sanitizedHtml,
    };
  }
}

function addressProblem(reason: 'empty' | 'invalid'): string {
  return reason === 'empty'
    ? 'An address is required.'
    : 'Addresses look like name.zz: letters, digits and hyphens, then .zz.';
}
