import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SellProductDto {
  @ApiProperty({ example: 5, description: 'Количество товара для продажи' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;
}
