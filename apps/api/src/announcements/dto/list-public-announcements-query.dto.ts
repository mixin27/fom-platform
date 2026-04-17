import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

function trimOptionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class ListPublicAnnouncementsQueryDto {
  @ApiPropertyOptional({
    enum: ['public', 'auth'],
    default: 'public',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsIn(['public', 'auth'])
  audience?: 'public' | 'auth';
}
