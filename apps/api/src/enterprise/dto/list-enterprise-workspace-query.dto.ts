import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

function trimOptionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class ListEnterpriseWorkspaceQueryDto {
  @ApiPropertyOptional({
    description: 'Filter to one accessible shop id. Omit to aggregate all entitled shops.',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shop_id?: string;

  @ApiPropertyOptional({
    enum: ['all', 'active', 'trial', 'expiring', 'overdue', 'inactive'],
    default: 'all',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsIn(['all', 'active', 'trial', 'expiring', 'overdue', 'inactive'])
  status?: string;
}
