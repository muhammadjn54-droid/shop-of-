import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class AddPaymentDto {
  @ApiProperty({ example: 50, description: 'Сумма вносимого платежа (сомони)' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({ example: 'cash', description: 'Способ оплаты: cash, card, transfer' })
  @IsOptional()
  @IsString()
  @IsIn(['cash', 'card', 'transfer'])
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'Частичная оплата', description: 'Примечание к платежу' })
  @IsOptional()
  @IsString()
  note?: string;
}
