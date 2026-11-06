import { Controller, Get, Query } from '@nestjs/common';
import type { SearchResponse } from '@small-web/shared';
import { parseLimit } from '../common/mongo.js';
import { SearchService } from './search.service.js';

@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  find(@Query('q') q: string | undefined, @Query('limit') limit?: string): Promise<SearchResponse> {
    return this.search.search(q ?? '', parseLimit(limit, 20, 50));
  }
}
