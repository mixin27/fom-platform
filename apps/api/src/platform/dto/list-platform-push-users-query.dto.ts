import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination-query.dto';

function trimOptionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class ListPlatformPushUsersQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by user name, email, phone, or connected shop name',
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
}
