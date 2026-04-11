import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import { deliveryStatuses } from './delivery.constants';

export class UpdateDeliveryDto {
  @ApiPropertyOptional({
    example: 'usr_ko_min',
    description: 'Reassign the delivery to another active shop member',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  driver_user_id?: string;

  @ApiPropertyOptional({
    enum: deliveryStatuses,
    example: 'out_for_delivery',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(deliveryStatuses)
  status?: (typeof deliveryStatuses)[number];

  @ApiPropertyOptional({
    example: 3000,
    minimum: 0,
    description: 'Send null to clear the delivery fee snapshot',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  delivery_fee?: number | null;

  @ApiPropertyOptional({
    example: '12/B, Thitsar Rd, Tarmwe, Yangon',
    description: 'Send null to reset the snapshot back to the current order customer address',
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  address_snapshot?: string | null;

  @ApiPropertyOptional({
    example: '2026-04-06T09:30:00.000Z',
    description: 'Send null to clear the scheduled time',
    nullable: true,
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString()
  scheduled_at?: string | null;

  @ApiPropertyOptional({
    example: '2026-04-06T11:45:00.000Z',
    description: 'Send null to reset the delivered time unless the delivery status is delivered',
    nullable: true,
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString()
  delivered_at?: string | null;
}
