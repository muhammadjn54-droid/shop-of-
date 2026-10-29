import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email пользователя' })
  @IsString()
  @IsNotEmpty()
  email: string;
}
