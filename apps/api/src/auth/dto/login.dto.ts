import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { trimLowercaseString, trimString } from './transforms';

export class LoginDto {
  @ApiProperty({
    example: 'maaye@example.com',
  })
  @Transform(trimLowercaseString)
  @IsEmail()
  @MaxLength(190)
  email!: string;

  @ApiProperty({
    example: 'Password123!',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
