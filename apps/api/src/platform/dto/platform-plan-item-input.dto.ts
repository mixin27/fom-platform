import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class PlatformPlanItemInputDto {
  @ApiProperty({
    example: 'Manual and paste-from-Messenger order capture',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  label!: string;

  @ApiPropertyOptional({
    example: 'Create structured orders from copied chat messages or manual entry.',
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string | null;

  @ApiProperty({
    example: 'available',
    enum: ['available', 'unavailable'],
  })
  @Transform(trimString)
  @IsString()
  @IsIn(['available', 'unavailable'])
  availability_status!: 'available' | 'unavailable';

  @ApiPropertyOptional({
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sort_order?: number;
}
