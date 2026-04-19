import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class UpdateMessengerConnectionDto {
  @ApiProperty({
    example: '123456789012345',
    description: 'Facebook Page ID used as the webhook recipient target',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(5)
  @MaxLength(64)
  page_id!: string;

  @ApiPropertyOptional({
    example: 'Ma Aye Fashion',
    description: 'Optional display label for the connected page',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  page_name?: string;

  @ApiProperty({
    example: 'EAABsbCS1iHgBAK...',
    description: 'Page access token from the Meta app configuration',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(20)
  @MaxLength(2048)
  page_access_token!: string;
}
