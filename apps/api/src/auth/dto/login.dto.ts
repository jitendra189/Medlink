import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'jitendra@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Test@12345' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
