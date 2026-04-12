import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination-query.dto';
import {
  notificationCategoryCodes,
  type NotificationCategoryCode,
} from '../notification.constants';

function toOptionalBoolean(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }

  return value;
}

export class ListUserNotificationsQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Optional shop filter for notifications tied to a shop',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  shop_id?: string;

  @ApiPropertyOptional({
    enum: notificationCategoryCodes,
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(notificationCategoryCodes)
  category?: NotificationCategoryCode;

  @ApiPropertyOptional({
    description: 'When true, only unread notifications are returned',
  })
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsOptional()
  @IsBoolean()
  unread_only?: boolean;
}
