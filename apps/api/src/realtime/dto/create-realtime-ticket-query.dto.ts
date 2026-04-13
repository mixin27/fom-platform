import { IsIn, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateRealtimeTicketQueryDto {
  @IsString()
  @IsIn(['platform', 'shop'])
  scope!: 'platform' | 'shop';

  @ValidateIf((value) => value.scope === 'shop')
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  shop_id?: string;
}
