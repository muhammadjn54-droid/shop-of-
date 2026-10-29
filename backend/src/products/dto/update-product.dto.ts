import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'дафтар', description: 'Название товара' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'CH0000034936', description: 'Штрихкод товара' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: '2026-10-06', description: 'Дата покупки' })
  @IsOptional()
  @IsString()
  purchase_date?: string;

  @ApiPropertyOptional({ example: '2026-10-06', description: 'Дата поступления' })
  @IsOptional()
  @IsString()
  arrival_date?: string;

  @ApiPropertyOptional({ example: 100, description: 'Количество поступившего товара' })
  @IsOptional()
  quantity_received?: number | string;

  @ApiPropertyOptional({ example: '5.50', description: 'Цена закупки' })
  @IsOptional()
  purchase_price?: number | string;

  @ApiPropertyOptional({ example: '10.00', description: 'Цена продажи' })
  @IsOptional()
  selling_price?: number | string;

  @ApiPropertyOptional({ example: 'stationery', description: 'Категория товара: stationery (конставар), toys (игрушка), perfumery (порфимерия), accessories (зарядмонакхо)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Файл / фото товара' })
  @IsOptional()
  file?: any;
}
