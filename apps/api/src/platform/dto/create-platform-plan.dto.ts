import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import { PlatformPlanItemInputDto } from './platform-plan-item-input.dto';

export class CreatePlatformPlanDto {
  @ApiProperty({
    example: 'pro_monthly',
    description: 'Unique plan code used in subscriptions',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9_-]+$/)
  code!: string;

  @ApiProperty({
    example: 'Shop Monthly',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: 'Single-shop monthly plan for daily Facebook order operations.',
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string | null;

  @ApiProperty({
    example: 7000,
  })
  @IsInt()
  @Min(0)
  @Max(1000000000)
  price!: number;

  @ApiPropertyOptional({
    example: 'MMK',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(10)
  currency?: string;

  @ApiProperty({
    example: 'monthly',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  billing_period!: string;

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
}
