import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

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
    example: 45000,
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
}
