import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import { deliveryStatuses } from './delivery.constants';

export class CreateDeliveryDto {
  @ApiProperty({
    example: 'ord_0240',
    description: 'Order id that this delivery belongs to',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  order_id!: string;

  @ApiProperty({
    example: 'usr_ko_min',
    description: 'Assigned driver user id. Must belong to the same shop.',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  driver_user_id!: string;

  @ApiPropertyOptional({
    enum: deliveryStatuses,
    example: 'scheduled',
    description: 'Defaults to scheduled when omitted',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(deliveryStatuses)
  status?: (typeof deliveryStatuses)[number];

  @ApiPropertyOptional({
    example: 3000,
    minimum: 0,
    description: 'Optional delivery fee snapshot for the delivery record',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  delivery_fee?: number | null;

  @ApiPropertyOptional({
    example: '12/B, Thitsar Rd, Tarmwe, Yangon',
    description: 'Optional address snapshot. Falls back to the current order customer address.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  address_snapshot?: string;

  @ApiPropertyOptional({
    example: '2026-04-06T09:30:00.000Z',
    description: 'Scheduled pickup or delivery time in ISO 8601 format',
  })
  @Transform(trimString)
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @ApiPropertyOptional({
    example: '2026-04-06T11:45:00.000Z',
    description: 'Delivery completion time. Only valid when status is delivered.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsDateString()
  delivered_at?: string;
}
