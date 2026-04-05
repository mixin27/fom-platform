import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from './transforms';

export class RefreshSessionDto {
  @Transform(trimString)
  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  refresh_token!: string;
}
