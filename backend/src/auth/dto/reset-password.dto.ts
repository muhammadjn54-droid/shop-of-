import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'jwt_token', description: 'Токен сброса пароля' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'newpassword123', description: 'Новый пароль' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
