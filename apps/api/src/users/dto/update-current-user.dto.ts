import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({
    example: 'Ma Aye',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    enum: ['en', 'my'],
    example: 'my',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(['en', 'my'])
  locale?: 'en' | 'my';

  @ApiPropertyOptional({
    example: 'maaye@example.com',
  })
  @Transform(trimLowercaseString)
  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  email?: string;

  @ApiPropertyOptional({
    example: '09 7800 1111',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}
