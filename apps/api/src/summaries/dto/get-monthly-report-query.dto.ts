import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class GetMonthlyReportQueryDto {
  @ApiPropertyOptional({
    example: '2026-04',
    description:
      'Month key in YYYY-MM. When omitted, the latest shop order month is used.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'month must be a date key in YYYY-MM format',
  })
  month?: string;
}
