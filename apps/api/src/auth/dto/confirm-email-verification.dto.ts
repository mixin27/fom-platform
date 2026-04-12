import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from './transforms';

export class ConfirmEmailVerificationDto {
  @ApiProperty({
    example: '0B3l0S1u3c3r3tT0k3n',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(20)
  @MaxLength(512)
  token!: string;
}
