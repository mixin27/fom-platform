import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

const autoReplyMatchTypes = ['contains', 'exact'] as const;

export class CreateMessengerAutoReplyRuleDto {
  @ApiProperty({
    example: 'Greeting',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    enum: autoReplyMatchTypes,
    example: 'contains',
  })
  @Transform(trimString)
  @IsIn(autoReplyMatchTypes)
  match_type!: (typeof autoReplyMatchTypes)[number];

  @ApiProperty({
    example: 'price',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  pattern!: string;

  @ApiProperty({
    example: 'Our latest price list is available in the catalog post pinned on the page.',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reply_text!: string;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
