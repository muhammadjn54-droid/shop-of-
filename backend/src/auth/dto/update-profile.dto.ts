import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'mansur_new', description: 'Новое имя пользователя' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'new_email@gmail.com', description: 'Новый email' })
  @IsOptional()
  @IsString()
  email?: string;
}
