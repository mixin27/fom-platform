import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class OrderCustomerInputDto {
  @ApiProperty({
    example: 'Daw Aye Aye',
    description: 'Customer display name',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    example: '09 9871 2345',
    description: 'Customer phone number used as the per-shop lookup key',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  phone!: string;

  @ApiPropertyOptional({
    example: 'Hlaing',
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  township?: string | null;

  @ApiPropertyOptional({
    example: 'No. 12, Shwe Taung Gyar St, Hlaing, Yangon',
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string | null;
}
