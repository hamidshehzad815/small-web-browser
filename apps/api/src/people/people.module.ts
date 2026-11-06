import { Module } from '@nestjs/common';
import { ModelsModule } from '../db/models.module.js';
import { PeopleController } from './people.controller.js';
import { PeopleService } from './people.service.js';
import { VisitsService } from './visits.service.js';

@Module({
  imports: [ModelsModule],
  controllers: [PeopleController],
  providers: [PeopleService, VisitsService],
})
export class PeopleModule {}
