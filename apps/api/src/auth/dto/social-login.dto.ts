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

export class SocialLoginDto {
  @Transform(trimString)
  @IsIn(['google', 'facebook'])
  provider!: 'google' | 'facebook';

  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  provider_user_id!: string;

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
  @IsString()
  @MaxLength(40)
  phone?: string;

  @Transform(trimString)
  @IsOptional()
  @IsIn(['en', 'my'])
  locale?: 'en' | 'my';
}
