import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, MaxLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class BeginMessengerOauthDto {
  @ApiProperty({
    example: 'https://app.getfom.com/dashboard/inbox/connect-meta/callback',
    description: 'Absolute redirect URI configured for the Meta login flow',
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
