import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class CompleteMessengerOauthDto {
  @ApiProperty({
    example: 'AQABAA...',
    description: 'Authorization code returned by Meta after the login dialog completes',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(4)
  @MaxLength(4096)
  code!: string;

  @ApiProperty({
    example: 'eyJraW5kIjoibWVzc2VuZ2VyX29hdXRoX3N0YXRlIn0...',
    description: 'Signed state value issued during the OAuth start step',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(16)
  @MaxLength(4096)
  state!: string;

  @ApiProperty({
    example: 'https://app.getfom.com/dashboard/inbox/connect-meta/callback',
    description: 'Absolute redirect URI used for both login and code exchange',
  })
  @Transform(trimString)
  @IsString()
  @IsUrl({
    require_protocol: true,
    require_tld: false,
  })
  @MaxLength(2048)
  redirect_uri!: string;
}
