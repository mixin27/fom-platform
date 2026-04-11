import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class UpdateOrderItemDto {
  @ApiPropertyOptional({
    example: 'prod_basic_tee',
    nullable: true,
    description: 'Send null to clear the product reference',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  product_id?: string | null;

  @ApiPropertyOptional({
    example: 'T-shirt',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  product_name?: string;

  @ApiPropertyOptional({
    example: 2,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  qty?: number;

  @ApiPropertyOptional({
    example: 12000,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  unit_price?: number;
}
