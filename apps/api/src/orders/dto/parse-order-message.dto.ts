import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class ParseOrderMessageDto {
  @ApiProperty({
    example:
      'Name: Daw Khin Myat\nPhone: 09 7812 3456\nAddress: No. 45, Bo Gyoke St, Sanchaung Tsp, Yangon\nProduct: Silk Longyi Set (Green, Size M)\nQty: 2\nPrice: 18,000 MMK\nDeli: 3,000',
    description:
      'Raw copied customer message from Messenger. The API parses it into a suggested order draft without creating an order.',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  message!: string;
}
