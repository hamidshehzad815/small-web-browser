import type { Connection } from 'mongoose';
import { HealthController } from './health.controller.js';

const withState = (readyState: number) =>
  new HealthController({ readyState } as unknown as Connection);

describe('HealthController', () => {
  it('reports ok when the database is connected', () => {
    expect(withState(1).check()).toEqual({ status: 'ok', db: 'up' });
  });

  it('reports degraded when the database is not connected', () => {
    expect(withState(0).check()).toEqual({ status: 'degraded', db: 'down' });
  });
});
