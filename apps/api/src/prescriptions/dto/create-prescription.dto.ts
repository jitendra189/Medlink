import { IsString, IsOptional, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MedicationDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() dose!: string;
  @ApiProperty() @IsString() frequency!: string;
  @ApiProperty() @IsString() duration!: string;
}

export class CreatePrescriptionDto {
  @ApiProperty() @IsUUID() patientId!: string;
  @ApiProperty() @IsUUID() doctorId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() bookingId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() diagnosis?: string;
  @ApiProperty({ type: [MedicationDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => MedicationDto) medications!: MedicationDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
