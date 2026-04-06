import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class UpdateMessageTemplateDto {
  @ApiPropertyOptional({
    example: 'Payment confirmation',
    description: 'Updated template label',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({
    example: 'Thanks! We received your payment and will ship your order tomorrow.',
    description: 'Updated reply text',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  body?: string;

  @ApiPropertyOptional({
    example: '/paid',
    description: 'Send null to clear the optional shortcut',
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  shortcut?: string | null;

  @ApiPropertyOptional({
    example: true,
    description: 'Set false to archive the template without deleting it',
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  is_active?: boolean;
}
