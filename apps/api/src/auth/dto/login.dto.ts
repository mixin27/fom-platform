import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { toBoolean, trimLowercaseString, trimString } from './transforms';

export class LoginDto {
  @ApiProperty({
    example: 'maaye@example.com',
  })
  @Transform(trimLowercaseString)
  @IsEmail()
  @MaxLength(190)
  email!: string;

  @ApiProperty({
    example: 'Password123!',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({
    required: false,
    default: false,
    description:
      'Revoke the currently active session on the same platform and continue on this device.',
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  logout_other_device?: boolean;
}
