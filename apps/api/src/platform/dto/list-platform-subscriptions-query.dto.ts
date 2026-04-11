import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination-query.dto';
import { platformSubscriptionStatuses } from '../platform-billing.constants';

function trimOptionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class ListPlatformSubscriptionsQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by invoice number, shop name, or payment reference',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    enum: ['all', 'paid', 'pending', 'overdue', 'failed'],
    default: 'all',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsIn(['all', 'paid', 'pending', 'overdue', 'failed'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter subscription rows by plan code',
    example: 'pro_monthly',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  plan?: string;

  @ApiPropertyOptional({
    enum: ['all', ...platformSubscriptionStatuses],
    default: 'all',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsIn(['all', ...platformSubscriptionStatuses])
  subscription_status?: string;
}
