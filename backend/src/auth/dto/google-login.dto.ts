import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID token (credential) from Google Identity Services' })
  @IsString()
  @IsNotEmpty()
  credential: string;
}
