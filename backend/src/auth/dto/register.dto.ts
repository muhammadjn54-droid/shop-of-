import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'mansur', description: 'Имя пользователя' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Email пользователя' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'password123', description: 'Пароль (минимум 6 символов)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'password123', description: 'Повтор пароля' })
  @IsOptional()
  @IsString()
  password2?: string;
}
