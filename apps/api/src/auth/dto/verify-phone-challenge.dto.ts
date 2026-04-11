import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @MinLength(8)
  @MaxLength(120)
  challenge_id!: string;

  @ApiProperty({
    example: '123456',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(4)
  @MaxLength(12)
  otp_code!: string;

  @ApiPropertyOptional({
    example: 'Seller 1111',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'maaye@example.com',
  })
  @Transform(trimLowercaseString)
  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  email?: string;

  @ApiPropertyOptional({
    enum: ['en', 'my'],
    example: 'my',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(['en', 'my'])
  locale?: 'en' | 'my';
}
