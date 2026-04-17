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

export class UpdatePlatformInvoiceDto {
  @ApiPropertyOptional({
    description: 'Updated invoice amount',
    example: 15000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Updated invoice currency',
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
    example: 'paid',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined)
  @IsIn(platformInvoiceStatuses)
  status?: (typeof platformInvoiceStatuses)[number];

  @ApiPropertyOptional({
    description: 'Updated due date, or null to clear',
    example: '2026-04-15T00:00:00.000Z',
    nullable: true,
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString()
  due_at?: string | null;

  @ApiPropertyOptional({
    description: 'Updated paid date, or null to clear',
    example: '2026-04-10T10:30:00.000Z',
    nullable: true,
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString()
  paid_at?: string | null;
}
