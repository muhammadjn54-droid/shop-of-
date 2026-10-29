import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'old_password123', description: 'Текущий пароль' })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: 'new_password123', description: 'Новый пароль (минимум 6 символов)' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
