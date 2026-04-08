import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import {
  platformSupportIssueKinds,
  platformSupportIssueSeverities,
  platformSupportIssueStatuses,
} from '../platform-support.constants';

export class CreatePlatformSupportIssueDto {
  @ApiPropertyOptional({
    description: 'Optional shop ID to link the issue to a tenant shop',
    example: 'cmshop123',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  shop_id?: string | null;

  @ApiProperty({
    enum: platformSupportIssueKinds,
    example: 'operations',
  })
  @Transform(trimString)
  @IsIn(platformSupportIssueKinds)
  kind!: (typeof platformSupportIssueKinds)[number];

  @ApiPropertyOptional({
    enum: platformSupportIssueSeverities,
    example: 'medium',
    default: 'medium',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(platformSupportIssueSeverities)
  severity?: (typeof platformSupportIssueSeverities)[number];

  @ApiPropertyOptional({
    enum: platformSupportIssueStatuses,
    example: 'open',
    default: 'open',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(platformSupportIssueStatuses)
  status?: (typeof platformSupportIssueStatuses)[number];

  @ApiProperty({
    example: 'Owner cannot access billing settings',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(4)
  @MaxLength(160)
  title!: string;

  @ApiProperty({
    example:
      'Shop owner reports a 403 when opening billing settings after plan migration.',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(8)
  @MaxLength(1000)
  detail!: string;

  @ApiPropertyOptional({
    description: 'Optional issue occurrence timestamp',
    example: '2026-04-08T08:30:00.000Z',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString()
  occurred_at?: string | null;

  @ApiPropertyOptional({
    description: 'Optional assignee user ID',
    example: 'cmuser123',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  assigned_to_user_id?: string | null;

  @ApiPropertyOptional({
    description: 'Optional resolution note used for resolved or dismissed issues',
    example: 'Contacted owner and updated the billing permissions mapping.',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MinLength(4)
  @MaxLength(800)
  resolution_note?: string | null;
}
