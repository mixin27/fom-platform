import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

function trimOptionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeOptionalEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class CreatePlatformShopDto {
  @ApiProperty({
    description: 'Shop name shown across the platform and owner portal',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    description: 'IANA timezone for the shop workspace',
    default: 'Asia/Yangon',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  timezone?: string;

  @ApiPropertyOptional({
    description:
      'Assign the shop to an existing user instead of creating or matching by email/phone',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  owner_user_id?: string;

  @ApiPropertyOptional({
    description: 'Owner display name',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  owner_name?: string;

  @ApiPropertyOptional({
    description: 'Owner email used for sign-in and communication',
  })
  @Transform(({ value }) => normalizeOptionalEmail(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  owner_email?: string;

  @ApiPropertyOptional({
    description: 'Owner phone number',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  owner_phone?: string;

  @ApiPropertyOptional({
    description:
      'Owner password used only when creating a new owner account or setting credentials for an existing owner without one',
    minLength: 8,
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  owner_password?: string;
}
