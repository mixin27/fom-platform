import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  MinLength,
} from 'class-validator';
import { trimLowercaseString, trimString } from './transforms';

export class RegisterDto {
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @Transform(trimLowercaseString)
  @IsEmail()
  @MaxLength(190)
  email!: string;

  @Transform(trimString)
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'password must include at least one uppercase letter, one lowercase letter, and one number',
  })
  password!: string;

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
