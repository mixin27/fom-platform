import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateShopSubscriptionInvoiceDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The code of the plan to subscribe to',
    example: 'pro_monthly',
  })
  plan_code: string;
}
