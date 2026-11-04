import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

const CONNECTED = 1;

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  check() {
    const up = this.connection.readyState === CONNECTED;
    return { status: up ? 'ok' : 'degraded', db: up ? 'up' : 'down' };
  }
}
