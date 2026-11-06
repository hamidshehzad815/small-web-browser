import { Module } from '@nestjs/common';
import { ModelsModule } from '../db/models.module.js';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';

@Module({
  imports: [ModelsModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
