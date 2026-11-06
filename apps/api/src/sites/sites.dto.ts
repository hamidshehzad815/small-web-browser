import { IsString, Length } from 'class-validator';
import { MAX_HTML_LENGTH, MAX_TITLE_LENGTH } from './content.js';

export class PublishDto {
  @IsString()
  @Length(1, 300)
  address: string;

  @IsString()
  @Length(1, MAX_TITLE_LENGTH)
  title: string;

  @IsString()
  @Length(1, MAX_HTML_LENGTH)
  html: string;

  @IsString()
  @Length(1, 64)
  authorId: string;
}
