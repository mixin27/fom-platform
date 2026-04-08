import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdatePlatformSupportIssueDto {
  @ApiPropertyOptional({
    enum: platformSupportIssueKinds,
    example: 'billing',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(platformSupportIssueKinds)
  kind?: (typeof platformSupportIssueKinds)[number];

  @ApiPropertyOptional({
    enum: platformSupportIssueSeverities,
    example: 'high',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(platformSupportIssueSeverities)
  severity?: (typeof platformSupportIssueSeverities)[number];

  @ApiPropertyOptional({
    enum: platformSupportIssueStatuses,
    example: 'in_progress',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(platformSupportIssueStatuses)
  status?: (typeof platformSupportIssueStatuses)[number];

  @ApiPropertyOptional({
    example: 'Owner cannot access billing settings',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MinLength(4)
  @MaxLength(160)
  title?: string | null;

  @ApiPropertyOptional({
    example: 'Error reproduced on iOS Safari. Updating auth scopes to resolve.',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MinLength(8)
  @MaxLength(1000)
  detail?: string | null;

  @ApiPropertyOptional({
    description: 'Set to null to clear the linked shop reference',
    example: 'cmshop123',
    nullable: true,
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  shop_id?: string | null;

  @ApiPropertyOptional({
    description: 'Set to null to clear assignee',
    example: 'cmuser123',
    nullable: true,
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  assigned_to_user_id?: string | null;

  @ApiPropertyOptional({
    description: 'Resolution note for resolved or dismissed issues',
    example: 'Invoice paid and reconciliation confirmed.',
    nullable: true,
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MinLength(4)
  @MaxLength(800)
  resolution_note?: string | null;

  @ApiPropertyOptional({
    description: 'Override occurrence timestamp',
    example: '2026-04-08T10:00:00.000Z',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString()
  occurred_at?: string | null;
}
