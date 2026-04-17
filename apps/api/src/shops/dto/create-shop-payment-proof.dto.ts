import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export class CreateShopPaymentProofDto {
  @ApiProperty({
    description: 'Invoice number to reconcile against',
    example: 'INV-20260417-ABC123',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  invoice_no!: string;

  @ApiProperty({
    description: 'Claimed transfer amount',
    example: 25000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amount_claimed!: number;

  @ApiPropertyOptional({
    description: 'Claimed currency (defaults to MMK)',
    example: 'MMK',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  currency_claimed?: string;

  @ApiProperty({
    description: 'Payment channel used by payer',
    example: 'KBZPay',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  payment_channel!: string;

  @ApiPropertyOptional({
    description: 'When the transfer happened',
    example: '2026-04-17T06:30:00.000Z',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString()
  paid_at?: string | null;

  @ApiPropertyOptional({ example: 'Aye Chan' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  sender_name?: string;

  @ApiPropertyOptional({ example: '09 7800 2222' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  sender_phone?: string;

  @ApiPropertyOptional({ example: 'KBZ-TRX-90871' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  transaction_ref?: string;

  @ApiPropertyOptional({
    description: 'Optional payer note',
    example: 'Paid from wife account name.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
