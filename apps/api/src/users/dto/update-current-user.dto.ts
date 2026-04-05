import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { trimLowercaseString, trimString } from '../../auth/dto/transforms';

export class UpdateCurrentUserDto {
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @Transform(trimString)
  @IsOptional()
  @IsIn(['en', 'my'])
  locale?: 'en' | 'my';

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
}
