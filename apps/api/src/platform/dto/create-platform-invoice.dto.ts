import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import { platformInvoiceStatuses } from '../platform-billing.constants';

export class CreatePlatformInvoiceDto {
  @ApiPropertyOptional({
    description: 'Invoice amount. Defaults to the current plan price.',
    example: 5000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Invoice currency. Defaults to the current plan currency.',
    example: 'MMK',
  })
  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({
    enum: platformInvoiceStatuses,
    example: 'pending',
    default: 'pending',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(platformInvoiceStatuses)
  status?: (typeof platformInvoiceStatuses)[number];

  @ApiPropertyOptional({
    description: 'Optional payment channel such as KBZPay or cash',
    example: 'KBZPay',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  payment_method?: string;

  @ApiPropertyOptional({
    description: 'Optional provider or transaction reference',
    example: 'KBZ-20260407-001',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  provider_ref?: string;

  @ApiPropertyOptional({
    description: 'Invoice due date',
    example: '2026-04-15T00:00:00.000Z',
    nullable: true,
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString()
  due_at?: string | null;

  @ApiPropertyOptional({
    description: 'Invoice paid date',
    example: '2026-04-10T10:30:00.000Z',
    nullable: true,
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString()
  paid_at?: string | null;
}
