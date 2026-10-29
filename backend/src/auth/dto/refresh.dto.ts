import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ example: 'refresh-token-string', description: 'Refresh token' })
  @IsString()
  @IsNotEmpty()
  refresh: string;
}
