import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination-query.dto';
import { deliveryStatuses } from './delivery.constants';

export class ListDeliveriesQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    enum: deliveryStatuses,
    example: 'scheduled',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(deliveryStatuses)
  status?: (typeof deliveryStatuses)[number];

  @ApiPropertyOptional({
    example: 'usr_ko_min',
    description: 'Filter by assigned driver user id',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  driver_user_id?: string;

  @ApiPropertyOptional({
    example: 'tarmwe',
    description: 'Case-insensitive search across order number, customer, address, and driver',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
