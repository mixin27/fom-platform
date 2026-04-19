import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class ResolveMessengerOauthSelectionDto {
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
}
