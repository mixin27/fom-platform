import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterPushDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  device_id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  provider!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  platform!: string;

  @IsString()
  @IsNotEmpty()
  push_token!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  device_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  app_version?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  locale?: string;
}
