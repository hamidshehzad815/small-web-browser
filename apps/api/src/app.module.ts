import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller.js';
import { PeopleModule } from './people/people.module.js';
import { SearchModule } from './search/search.module.js';
import { SitesModule } from './sites/sites.module.js';

@Module({
  imports: [
    // One .env at the repo root serves both apps.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI', 'mongodb://localhost:27017/small-web'),
      }),
    }),
    SitesModule,
    SearchModule,
    PeopleModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
