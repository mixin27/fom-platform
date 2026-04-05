import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from './transforms';

export class StartPhoneChallengeDto {
  @Transform(trimString)
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  phone!: string;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  purpose?: string;
}
