import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { announcementAudienceValues, announcementStateValues } from '../announcement.constants';

function trimOptionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class ListPlatformAnnouncementsQueryDto {
  @ApiPropertyOptional({
    description: 'Search by title, body, or CTA label',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    enum: ['all', ...announcementStateValues],
    default: 'all',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsIn(['all', ...announcementStateValues])
  state?: string;

  @ApiPropertyOptional({
    enum: ['all', ...announcementAudienceValues],
    default: 'all',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsIn(['all', ...announcementAudienceValues])
  audience?: string;
}
