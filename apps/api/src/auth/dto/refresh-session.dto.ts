import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { trimString } from './transforms';

export class RefreshSessionDto {
  @ApiProperty({
    description: 'JWT refresh token returned by the login or register endpoint',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  refresh_token!: string;
}
