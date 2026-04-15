import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import { trimStringArray } from './transforms';

export class CreateShopRoleDto {
  @ApiProperty({
    example: 'Operations manager',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: 'Can manage orders, deliveries, and customer records.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @ApiProperty({
    type: [String],
    example: ['orders.read', 'orders.write', 'deliveries.write'],
  })
  @Transform(trimStringArray)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  permission_codes!: string[];
}
