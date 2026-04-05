import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class UpdateShopDto {
  @ApiPropertyOptional({
    example: 'Ma Aye Fashion',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'Asia/Yangon',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;
}
