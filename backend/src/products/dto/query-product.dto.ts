import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryProductDto {
  @ApiPropertyOptional({ description: 'Поиск по названию ИЛИ штрихкоду' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Точный поиск по штрихкоду' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ description: 'Сортировка (например name, -name, purchase_date, -purchase_date)' })
  @IsOptional()
  @IsString()
  ordering?: string;

  @ApiPropertyOptional({ description: 'Номер страницы' })
  @IsOptional()
  page?: string | number;

  @ApiPropertyOptional({ description: 'Количество на странице' })
  @IsOptional()
  limit?: string | number;

  @ApiPropertyOptional({ description: 'Фильтрация по категории (stationery, toys, perfumery, accessories, all)' })
  @IsOptional()
  @IsString()
  category?: string;
}
