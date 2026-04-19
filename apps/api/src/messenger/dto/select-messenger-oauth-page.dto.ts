import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class SelectMessengerOauthPageDto {
  @ApiProperty({
    example: 'eyJraW5kIjoibWVzc2VuZ2VyX29hdXRoX3NlbGVjdGlvbiJ9...',
    description:
      'Encrypted page selection token issued when the Meta account manages more than one page',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(16)
  @MaxLength(8192)
  selection_token!: string;

  @ApiProperty({
    example: '123456789012345',
    description: 'Facebook Page ID selected from the OAuth results',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(5)
  @MaxLength(64)
  page_id!: string;

  @ApiPropertyOptional({
    example: 'Ma Aye Fashion',
    description: 'Optional override label to store for the connected page',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  page_name?: string;
}
