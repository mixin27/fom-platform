import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import {
  notificationCategoryCodes,
  type NotificationCategoryCode,
} from '../notification.constants';

export class MarkAllNotificationsReadDto {
  @ApiPropertyOptional({
    description: 'Optional shop filter to mark only one shop inbox as read',
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
}
