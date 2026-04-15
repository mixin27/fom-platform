import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class PlatformPlanLimitInputDto {
  @ApiProperty({
    example: 'team.active_staff_members',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  code!: string;

  @ApiProperty({
    example: 'Active staff seats',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  label!: string;

  @ApiPropertyOptional({
    example: 'Maximum number of non-owner active staff accounts allowed on this plan.',
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string | null;

  @ApiPropertyOptional({
    example: 3,
    nullable: true,
    description: 'Null means unlimited.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000)
  value?: number | null;

  @ApiPropertyOptional({
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sort_order?: number;
}
