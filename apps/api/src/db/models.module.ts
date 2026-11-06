import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MODEL,
  personSchema,
  revisionSchema,
  sessionSchema,
  siteSchema,
  visitSchema,
} from './schemas.js';

const models = MongooseModule.forFeature([
  { name: MODEL.Person, schema: personSchema },
  { name: MODEL.Site, schema: siteSchema },
  { name: MODEL.Revision, schema: revisionSchema },
  { name: MODEL.Visit, schema: visitSchema },
  { name: MODEL.Session, schema: sessionSchema },
]);

@Module({ imports: [models], exports: [models] })
export class ModelsModule {}
