import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import { orderStatuses } from './order.constants';

export class ChangeOrderStatusDto {
  @ApiProperty({
    example: 'confirmed',
    enum: orderStatuses,
  })
  @Transform(trimString)
  @IsIn(orderStatuses)
  status!: (typeof orderStatuses)[number];

  @ApiPropertyOptional({
    example: 'Customer confirmed pickup time',
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
