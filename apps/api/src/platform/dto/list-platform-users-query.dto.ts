import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination-query.dto';

function trimOptionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class ListPlatformUsersQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by user name, email, phone, or linked shop name',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    enum: ['all', 'platform', 'shop_owner', 'staff', 'no_shop'],
    default: 'all',
  })
  @Transform(({ value }) => trimOptionalString(value))
  @IsOptional()
  @IsIn(['all', 'platform', 'shop_owner', 'staff', 'no_shop'])
  access?: string;
}
