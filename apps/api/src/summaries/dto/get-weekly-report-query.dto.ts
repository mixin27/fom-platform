import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class GetWeeklyReportQueryDto {
  @ApiPropertyOptional({
    example: '2026-04-02',
    description:
      'Anchor date in YYYY-MM-DD. The report covers the Monday-start week containing this date. When omitted, the latest shop order date is used.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be a date in YYYY-MM-DD format',
  })
  date?: string;
}
