import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { trimLowercaseString, trimString } from './transforms';

export class VerifyPhoneChallengeDto {
  @Transform(trimString)
  @IsString()
  @MinLength(8)
  @MaxLength(120)
  challenge_id!: string;

  @Transform(trimString)
  @IsString()
  @MinLength(4)
  @MaxLength(12)
  otp_code!: string;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @Transform(trimLowercaseString)
  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  email?: string;

  @Transform(trimString)
  @IsOptional()
  @IsIn(['en', 'my'])
  locale?: 'en' | 'my';
}
