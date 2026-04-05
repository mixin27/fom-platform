import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class AddOrderItemDto {
  @ApiPropertyOptional({
    example: 'prod_basic_tee',
    nullable: true,
    description: 'Optional product reference',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  product_id?: string | null;

  @ApiProperty({
    example: 'T-shirt',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  product_name!: string;

  @ApiProperty({
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  qty!: number;

  @ApiProperty({
    example: 12000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  unit_price!: number;
}
