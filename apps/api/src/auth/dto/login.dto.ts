import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { trimLowercaseString, trimString } from './transforms';

export class LoginDto {
  @Transform(trimLowercaseString)
  @IsEmail()
  @MaxLength(190)
  email!: string;

  @Transform(trimString)
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
