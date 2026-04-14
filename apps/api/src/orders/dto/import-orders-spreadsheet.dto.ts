import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimString } from '../../auth/dto/transforms';

export class ImportOrdersSpreadsheetDto {
  @ApiProperty({
    example: 'legacy-orders.xlsx',
    description: 'Original spreadsheet filename from the client upload.',
  })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  filename!: string;

  @ApiProperty({
    description: 'Base64-encoded spreadsheet bytes for CSV or XLSX content.',
  })
  @IsString()
  @MinLength(1)
  content_base64!: string;
}
