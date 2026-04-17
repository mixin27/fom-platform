import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  announcementAudienceValues,
  announcementSeverityValues,
  announcementStatusValues,
} from '../announcement.constants';

function trimOptionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreatePlatformAnnouncementDto {
  @ApiProperty({ example: 'Scheduled maintenance window' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiProperty({
    example:
      'Billing and exports may be unavailable for up to 15 minutes during database maintenance.',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsString()
  @MaxLength(2000)
  body!: string;

  @ApiPropertyOptional({ enum: announcementSeverityValues, default: 'info' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsIn(announcementSeverityValues)
  severity?: string;

  @ApiPropertyOptional({ enum: announcementStatusValues, default: 'draft' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsIn(announcementStatusValues)
  status?: string;

  @ApiProperty({ enum: announcementAudienceValues, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(announcementAudienceValues, { each: true })
  audiences!: string[];

  @ApiPropertyOptional({ example: 'Billing workspace' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  cta_label?: string;

  @ApiPropertyOptional({ example: '/dashboard/billing' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cta_url?: string;

  @ApiPropertyOptional({ example: '2026-04-20T02:00:00.000Z' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  starts_at?: string;

  @ApiPropertyOptional({ example: '2026-04-20T04:00:00.000Z' })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  ends_at?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
