import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class GetDailySummaryQueryDto {
  @ApiPropertyOptional({
    example: '2026-04-02',
    description:
      'Shop-local summary date in YYYY-MM-DD format. When omitted, the latest shop order date is used.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be a date in YYYY-MM-DD format',
  })
  date?: string;
}
