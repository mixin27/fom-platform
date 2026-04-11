import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import { trimStringArray } from './transforms';

export class UpdateShopMemberDto {
  @ApiPropertyOptional({
    enum: ['active', 'invited', 'disabled'],
    example: 'disabled',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(['active', 'invited', 'disabled'])
  status?: 'active' | 'invited' | 'disabled';

  @ApiPropertyOptional({
    type: [String],
    example: ['staff'],
  })
  @Transform(trimStringArray)
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  role_codes?: string[];
}
