import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { trimString } from './transforms';

export class StartPhoneChallengeDto {
  @ApiProperty({
    example: '09 7800 1111',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  phone!: string;

  @ApiPropertyOptional({
    example: 'login',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  purpose?: string;
}
