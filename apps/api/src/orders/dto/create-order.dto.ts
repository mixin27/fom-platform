import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { trimString } from '../../auth/dto/transforms';
import { AddOrderItemDto } from './add-order-item.dto';
import { OrderCustomerInputDto } from './order-customer-input.dto';
import { orderSources, orderStatuses } from './order.constants';

export class CreateOrderDto {
  @ApiPropertyOptional({
    example: 'cus_123',
    description: 'Existing customer ID. When omitted, customer details must be provided.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  customer_id?: string;

  @ApiPropertyOptional({
    type: () => OrderCustomerInputDto,
    description: 'Preferred inline customer payload when creating an order for a new or matched customer',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderCustomerInputDto)
  customer?: OrderCustomerInputDto;

  @ApiPropertyOptional({
    example: 'Daw Aye Aye',
    description: 'Legacy inline field used when `customer` is omitted',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  customer_name?: string;

  @ApiPropertyOptional({
    example: '09 9871 2345',
    description: 'Legacy inline field used when `customer` is omitted',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({
    example: 'Hlaing',
    nullable: true,
    description: 'Legacy inline field used when `customer` is omitted',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  township?: string | null;

  @ApiPropertyOptional({
    example: 'No. 12, Shwe Taung Gyar St, Hlaing, Yangon',
    nullable: true,
    description: 'Legacy inline field used when `customer` is omitted',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string | null;

  @ApiPropertyOptional({
    type: () => [AddOrderItemDto],
    description: 'Preferred order item array',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddOrderItemDto)
  items?: AddOrderItemDto[];

  @ApiPropertyOptional({
    example: 'prod_basic_tee',
    nullable: true,
    description: 'Legacy single-item field used when `items` is omitted',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  product_id?: string | null;

  @ApiPropertyOptional({
    example: 'T-shirt',
    description: 'Legacy single-item field used when `items` is omitted',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  product_name?: string;

  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    description: 'Legacy single-item field used when `items` is omitted',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  qty?: number;

  @ApiPropertyOptional({
    example: 12000,
    minimum: 0,
    description: 'Legacy single-item field used when `items` is omitted',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  unit_price?: number;

  @ApiPropertyOptional({
    example: 'new',
    enum: orderStatuses,
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(orderStatuses)
  status?: (typeof orderStatuses)[number];

  @ApiPropertyOptional({
    example: 'manual',
    enum: orderSources,
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(orderSources)
  source?: (typeof orderSources)[number];

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
    example: 'Deliver after 5pm',
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
