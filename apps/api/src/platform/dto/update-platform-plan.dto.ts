import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import { PlatformPlanLimitInputDto } from './platform-plan-limit-input.dto';
import { PlatformPlanItemInputDto } from './platform-plan-item-input.dto';

export class UpdatePlatformPlanDto {
  @ApiPropertyOptional({
    example: 'pro_monthly',
    description: 'Unique plan code used in subscriptions',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9_-]+$/)
  code?: string;

  @ApiPropertyOptional({
    example: 'Pro Monthly',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'Pro tier with monthly billing cycle',
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string | null;

  @ApiPropertyOptional({
    example: 15000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000000)
  price?: number;

  @ApiPropertyOptional({
    example: 'MMK',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({
    example: 'monthly',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  billing_period?: string;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sort_order?: number;

  @ApiPropertyOptional({
    type: [PlatformPlanItemInputDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PlatformPlanItemInputDto)
  items?: PlatformPlanItemInputDto[];

  @ApiPropertyOptional({
    type: [PlatformPlanLimitInputDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PlatformPlanLimitInputDto)
  limits?: PlatformPlanLimitInputDto[];
}
