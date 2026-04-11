import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import { platformSubscriptionStatuses } from '../platform-billing.constants';

export class UpdatePlatformSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Assign the subscription to a plan by code',
    example: 'pro_monthly',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  plan_code?: string;

  @ApiPropertyOptional({
    description: 'Assign the subscription to a plan by ID',
    example: 'cmplan123',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  plan_id?: string;

  @ApiPropertyOptional({
    enum: platformSubscriptionStatuses,
    example: 'active',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined)
  @IsIn(platformSubscriptionStatuses)
  status?: (typeof platformSubscriptionStatuses)[number];

  @ApiPropertyOptional({
    description: 'Subscription start date',
    example: '2026-04-07T00:00:00.000Z',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString()
  start_at?: string;

  @ApiPropertyOptional({
    description: 'Subscription end date, or null to clear it',
    example: '2026-05-07T00:00:00.000Z',
    nullable: true,
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString()
  end_at?: string | null;

  @ApiPropertyOptional({
    description: 'Whether the subscription should auto-renew',
    example: true,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  auto_renews?: boolean;
}
