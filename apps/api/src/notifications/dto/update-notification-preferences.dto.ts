import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { trimString } from '../../auth/dto/transforms';
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

export class UpdateNotificationPreferenceItemDto {
  @ApiProperty({
    enum: notificationCategoryCodes,
  })
  @Transform(trimString)
  @IsIn(notificationCategoryCodes)
  category!: NotificationCategoryCode;

  @ApiPropertyOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsOptional()
  @IsBoolean()
  in_app_enabled?: boolean;

  @ApiPropertyOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsOptional()
  @IsBoolean()
  email_enabled?: boolean;
}

export class UpdateNotificationPreferencesDto {
  @ApiProperty({
    type: UpdateNotificationPreferenceItemDto,
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateNotificationPreferenceItemDto)
  preferences!: UpdateNotificationPreferenceItemDto[];
}
