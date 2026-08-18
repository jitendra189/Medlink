import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@medlink/shared';

export class RegisterDto {
  @ApiProperty({ example: 'Jitendra Singh' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'jitendra@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Test@12345', minLength: 8 })
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password!: string;

  @ApiPropertyOptional({ enum: [Role.PATIENT, Role.DONOR], default: Role.PATIENT })
  @IsOptional()
  @IsEnum([Role.PATIENT, Role.DONOR])
  role?: Role.PATIENT | Role.DONOR;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;
}
