import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@medlink/shared';

export class AuthUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ enum: Role }) role!: Role;
}

export class AuthResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty() user!: AuthUserDto;
}
