import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePublicContactSubmissionDto {
  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiPropertyOptional({ example: 'Aye Chan' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Billing question' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiProperty({
    example: 'Hello, I need help with…',
    minLength: 10,
    maxLength: 8000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(8000)
  message!: string;

  /** Honeypot — must be left blank by real users. */
  @ApiPropertyOptional({
    description: 'Anti-spam honeypot (leave empty)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
