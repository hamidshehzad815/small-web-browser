import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import type { PageShown, ResolveResponse } from '@small-web/shared';
import { PublishDto } from './sites.dto.js';
import { SitesService } from './sites.service.js';

@Controller()
export class SitesController {
  constructor(private readonly sites: SitesService) {}

  @Get('resolve')
  resolve(@Query('address') address: string | undefined): Promise<ResolveResponse> {
    return this.sites.resolve(address ?? '');
  }

  @Get('revisions/:revisionId')
  revision(@Param('revisionId') revisionId: string): Promise<PageShown> {
    return this.sites.getRevision(revisionId);
  }

  @Post('sites')
  publish(@Body() dto: PublishDto): Promise<PageShown> {
    return this.sites.publish(dto);
  }
}
