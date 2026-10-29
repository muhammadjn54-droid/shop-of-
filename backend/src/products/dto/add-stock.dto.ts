import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddStockDto {
  @ApiProperty({ example: 200, description: 'Количество поступления (штук)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiPropertyOptional({ example: '0.50', description: 'Новая закупочная цена (необязательно)' })
  @IsOptional()
  purchase_price?: string | number;
}
