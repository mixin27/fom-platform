import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';
import { trimLowercaseString } from './transforms';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'maaye@example.com',
  })
  @Transform(trimLowercaseString)
  @IsEmail()
  @MaxLength(190)
  email!: string;
}
