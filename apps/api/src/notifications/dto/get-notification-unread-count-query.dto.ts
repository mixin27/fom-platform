import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
import {
  notificationCategoryCodes,
  type NotificationCategoryCode,
} from '../notification.constants';

export class GetNotificationUnreadCountQueryDto {
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
}
