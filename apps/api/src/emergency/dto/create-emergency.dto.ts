import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmergencyType } from '@medlink/shared';

export class CreateEmergencyDto {
  @ApiProperty({ enum: EmergencyType }) @IsEnum(EmergencyType) type!: EmergencyType;
  @ApiProperty() @IsNumber() patientLat!: number;
  @ApiProperty() @IsNumber() patientLng!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
