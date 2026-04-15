import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { trimString } from './transforms';

export class AcceptInvitationDto {
  @ApiProperty({
    example: '0B3l0S1u3c3r3tT0k3n',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(20)
  @MaxLength(512)
  token!: string;

  @ApiProperty({
    example: 'NewPassword123!',
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
}
