import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { trimString } from '../../auth/dto/transforms';

export const paymentProofStatuses = [
  'submitted',
  'approved',
  'rejected',
  'suspicious',
] as const;

export class UpdatePlatformPaymentProofDto {
  @ApiPropertyOptional({
    enum: paymentProofStatuses,
    example: 'approved',
  })
  @Transform(trimString)
  @ValidateIf((_, value) => value !== undefined)
  @IsIn(paymentProofStatuses)
  status?: (typeof paymentProofStatuses)[number];

  @ApiPropertyOptional({
    description: 'Reviewer note or rejection reason',
    nullable: true,
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  admin_note?: string | null;
}
