import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { SearchResponse } from '@small-web/shared';
import type { Model } from 'mongoose';
import { storedAddress } from '../common/mongo.js';
import { MODEL, type PersonDoc, type SiteDoc } from '../db/schemas.js';
import { makeSnippet, queryTerms } from './snippet.js';

const MAX_QUERY_LENGTH = 100;

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(MODEL.Site) private readonly sites: Model<SiteDoc>,
    @InjectModel(MODEL.Person) private readonly people: Model<PersonDoc>,
  ) {}

  /** Full-text search over title (weighted higher) and page text, best match first. */
  async search(rawQuery: string, limit: number): Promise<SearchResponse> {
    const query = rawQuery.trim();
    if (query === '') throw new BadRequestException('Type something to search for.');
    if (query.length > MAX_QUERY_LENGTH) {
      throw new BadRequestException(`Searches are limited to ${MAX_QUERY_LENGTH} characters.`);
    }

    const sites = await this.sites
      .find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' }, _id: 1 })
      .limit(limit)
      .lean();

    const authorIds = [...new Set(sites.map((site) => site.authorId))];
    const authors = await this.people.find({ _id: { $in: authorIds } }).lean();
    const names = new Map(authors.map((author) => [author._id, author.name]));

    const terms = queryTerms(query);
    return {
      query,
      results: sites.map((site) => ({
        address: storedAddress(site._id),
        title: site.title,
        authorName: names.get(site.authorId) ?? 'Unknown',
        snippet: makeSnippet(site.text, terms),
      })),
    };
  }
}
