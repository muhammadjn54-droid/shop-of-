import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReturnProductDto {
  @ApiProperty({ example: 2, description: 'Количество товара для возврата' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;
}
