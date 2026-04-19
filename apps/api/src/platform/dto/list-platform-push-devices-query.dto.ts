import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination-query.dto';

function trimOptionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class ListPlatformPushDevicesQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Search by device id, device name, user name, email, or shop name',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    enum: ['all', 'active', 'inactive'],
    default: 'all',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsIn(['all', 'active', 'inactive'])
  status?: string;

  @ApiPropertyOptional({
    enum: ['all', 'android', 'ios'],
    default: 'all',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsIn(['all', 'android', 'ios'])
  platform?: string;

  @ApiPropertyOptional({
    description: 'Filter by provider such as fcm',
    example: 'fcm',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(64)
  provider?: string;
}
