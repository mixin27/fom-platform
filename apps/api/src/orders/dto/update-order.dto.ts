import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import { orderSources } from './order.constants';

export class UpdateOrderDto {
  @ApiPropertyOptional({
    example: 'cus_123',
    description: 'Move the order to another customer in the same shop',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  customer_id?: string;

  @ApiPropertyOptional({
    example: 3000,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  delivery_fee?: number;

  @ApiPropertyOptional({
    example: 'MMK',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({
    example: 'manual',
    enum: orderSources,
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(orderSources)
  source?: (typeof orderSources)[number];

  @ApiPropertyOptional({
    example: 'Deliver after 5pm',
    nullable: true,
    description: 'Send null to clear the note',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
