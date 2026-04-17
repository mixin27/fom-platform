import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination-query.dto';

export class ListMessengerThreadsQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    example: 'aye',
    description:
      'Case-insensitive search across customer label, PSID, and latest message preview',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
