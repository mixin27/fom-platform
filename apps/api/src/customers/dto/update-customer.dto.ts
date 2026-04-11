import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class UpdateCustomerDto {
  @ApiPropertyOptional({
    example: 'Daw Aye Aye',
    description: 'Updated customer display name',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: '09 9871 2345',
    description: 'Updated phone number. Must remain unique within the shop.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({
    example: 'Hlaing',
    description: 'Send null to clear township',
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  township?: string | null;

  @ApiPropertyOptional({
    example: 'No. 12, Shwe Taung Gyar St, Hlaing, Yangon',
    description: 'Send null to clear address',
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string | null;

  @ApiPropertyOptional({
    example: 'Loyal repeat customer',
    description: 'Send null to clear notes',
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
