import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination-query.dto';
import { trimString } from '../../auth/dto/transforms';

export class ListCustomersQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    example: 'aye',
    description: 'Case-insensitive search across name, phone, township, and address',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    enum: ['all', 'vip', 'new_this_week', 'top_spenders'],
    example: 'all',
    description: 'Predefined customer segment filter',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(['all', 'vip', 'new_this_week', 'top_spenders'])
  segment?: 'all' | 'vip' | 'new_this_week' | 'top_spenders';

  @ApiPropertyOptional({
    enum: ['recent', 'top_spenders', 'name'],
    example: 'recent',
    description: 'Customer sort order',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(['recent', 'top_spenders', 'name'])
  sort?: 'recent' | 'top_spenders' | 'name';
}
