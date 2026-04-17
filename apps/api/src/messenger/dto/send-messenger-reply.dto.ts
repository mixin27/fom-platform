import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class SendMessengerReplyDto {
  @ApiProperty({
    example: 'မင်္ဂလာပါ။ သင့် order ကို confirm လုပ်ပေးလိုက်ပါပြီ။',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;
}
