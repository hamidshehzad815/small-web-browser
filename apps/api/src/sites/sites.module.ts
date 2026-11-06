import { Module } from '@nestjs/common';
import { ModelsModule } from '../db/models.module.js';
import { SitesController } from './sites.controller.js';
import { SitesService } from './sites.service.js';

@Module({
  imports: [ModelsModule],
  controllers: [SitesController],
  providers: [SitesService],
})
export class SitesModule {}
