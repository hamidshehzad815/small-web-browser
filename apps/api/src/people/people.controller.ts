import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import type { PersonDto, SessionDto, VisitDto, VisitPage } from '@small-web/shared';
import { parseLimit } from '../common/mongo.js';
import { RecordVisitDto } from './people.dto.js';
import { PeopleService } from './people.service.js';
import { VisitsService } from './visits.service.js';

@Controller('people')
export class PeopleController {
  constructor(
    private readonly people: PeopleService,
    private readonly visits: VisitsService,
  ) {}

  @Get()
  list(): Promise<PersonDto[]> {
    return this.people.list();
  }

  @Get(':personId/visits')
  history(
    @Param('personId') personId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<VisitPage> {
    return this.visits.list(personId, parseLimit(limit, 50, 200), cursor);
  }

  @Post(':personId/visits')
  record(@Param('personId') personId: string, @Body() dto: RecordVisitDto): Promise<VisitDto> {
    return this.visits.record(personId, dto);
  }

  @Get(':personId/session')
  session(@Param('personId') personId: string): Promise<SessionDto> {
    return this.people.getSession(personId);
  }

  @Put(':personId/session')
  saveSession(@Param('personId') personId: string, @Body() body: unknown): Promise<SessionDto> {
    return this.people.saveSession(personId, body);
  }
}
