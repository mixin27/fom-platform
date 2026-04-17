import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePublicContactSubmissionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  archived?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  admin_note?: string;
}
