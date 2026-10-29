import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Муҳаммад', description: 'Имя сотрудника' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Мудир', description: 'Должность' })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiPropertyOptional({ example: 2500, description: 'Базовая зарплата (сомони)' })
  @IsOptional()
  @IsNumber()
  baseSalary?: number;

  @ApiPropertyOptional({ example: true, description: 'Есть ли фиксированные выходные' })
  @IsOptional()
  @IsBoolean()
  hasRest?: boolean;

  @ApiPropertyOptional({ example: 4, description: 'Количество выходных дней' })
  @IsOptional()
  @IsNumber()
  restDays?: number;

  @ApiPropertyOptional({ example: 0, description: 'Количество пропущенных дней' })
  @IsOptional()
  @IsNumber()
  absentDays?: number;
}
