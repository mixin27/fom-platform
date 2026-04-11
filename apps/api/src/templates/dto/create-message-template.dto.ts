import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class CreateMessageTemplateDto {
  @ApiProperty({
    example: 'Payment confirmation',
    description: 'Short label used to identify the template in the app',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @ApiProperty({
    example: 'Thanks! We received your payment and will ship your order tomorrow.',
    description: 'Reply text that the seller can copy and send to a customer',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  body!: string;

  @ApiPropertyOptional({
    example: '/paid',
    description: 'Optional shortcut or slash command shown to the seller',
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
    description: 'Whether the template should be available for use immediately',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
