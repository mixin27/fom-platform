import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination-query.dto';

const templateStates = ['all', 'active', 'inactive'] as const;

export class ListMessageTemplatesQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    example: 'delivery',
    description: 'Case-insensitive search across title, shortcut, and template body',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    enum: templateStates,
    example: 'active',
    description: 'Filter templates by active state',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(templateStates)
  state?: (typeof templateStates)[number];
}
