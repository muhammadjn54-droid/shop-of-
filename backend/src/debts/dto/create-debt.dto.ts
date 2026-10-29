import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateDebtDto {
  @ApiProperty({ example: 'Алишер', description: 'Имя клиента/должника' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiPropertyOptional({ example: '+992 90 000 0000', description: 'Номер телефона' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID клиента (если долг привязан к клиенту)' })
  @IsOptional()
  customerId?: number | string;

  @ApiProperty({ example: 150, description: 'Сумма долга в сомони' })
  @IsNumber()
  totalAmount: number;

  @ApiPropertyOptional({ example: 'Тетради 12л, ручки, клей', description: 'Описание взятых товаров' })
  @IsOptional()
  @IsString()
  description?: string;
}
