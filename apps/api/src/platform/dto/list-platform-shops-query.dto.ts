import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination-query.dto';

function trimOptionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class ListPlatformShopsQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by shop name, owner email, or township',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    enum: ['all', 'active', 'trial', 'expiring', 'overdue', 'inactive'],
    default: 'all',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsIn(['all', 'active', 'trial', 'expiring', 'overdue', 'inactive'])
  status?: string;

  @ApiPropertyOptional({
    description:
      'Filter by plan code such as trial, pro_monthly, or pro_yearly',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(60)
  plan?: string;
}
