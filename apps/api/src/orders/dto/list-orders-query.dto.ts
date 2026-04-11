import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination-query.dto';
import { orderFilterStatuses } from './order.constants';

export class ListOrdersQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    enum: orderFilterStatuses,
    example: 'pending',
    description: 'Order status filter. `pending` expands to new, confirmed, and out_for_delivery.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(orderFilterStatuses)
  status?: (typeof orderFilterStatuses)[number];

  @ApiPropertyOptional({
    example: 'today',
    description: 'Use `today` or a local shop date in YYYY-MM-DD format',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @Matches(/^(today|\d{4}-\d{2}-\d{2})$/, {
    message: 'date must be "today" or a date in YYYY-MM-DD format',
  })
  date?: string;

  @ApiPropertyOptional({
    example: 'aye',
    description: 'Case-insensitive search across order number, customer, address, and item names',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
