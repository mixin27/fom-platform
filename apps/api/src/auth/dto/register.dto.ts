import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsEmail,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  MinLength,
} from 'class-validator';
import { trimLowercaseString, trimString } from './transforms';

export class RegisterDto {
  @ApiProperty({
    example: 'Ma Aye',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

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
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'password must include at least one uppercase letter, one lowercase letter, and one number',
  })
  password!: string;

  @ApiPropertyOptional({
    example: '09 7800 1111',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({
    enum: ['en', 'my'],
    example: 'my',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(['en', 'my'])
  locale?: 'en' | 'my';

  @ApiProperty({
    example: true,
    description:
      'Must be true to confirm agreement to the Terms and Conditions',
  })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @Equals(true, {
    message: 'accepted_terms must be true',
  })
  accepted_terms!: boolean;

  @ApiProperty({
    example: true,
    description: 'Must be true to confirm agreement to the Privacy Policy',
  })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @Equals(true, {
    message: 'accepted_privacy must be true',
  })
  accepted_privacy!: boolean;
}
