import { VIA_VALUES, type Via } from '@small-web/shared';
import { IsIn, IsObject } from 'class-validator';

export class RecordVisitDto {
  @IsIn(VIA_VALUES)
  via: Via;

  /** Checked in full by `parseEntry` in the service; the DTO only guarantees it is an object. */
  @IsObject()
  entry: Record<string, unknown>;
}
