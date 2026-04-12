import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

function trimOptionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class SearchPlatformOwnerAccountsQueryDto {
  @ApiPropertyOptional({
    description: 'Search by user name, email, or phone',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  query?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of matching accounts to return',
    default: 8,
    minimum: 1,
    maximum: 20,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
