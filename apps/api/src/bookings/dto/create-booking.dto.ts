import { IsEnum, IsDateString, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingType } from '@medlink/shared';

export class CreateBookingDto {
  @ApiProperty() @IsString() doctorId!: string;
  @ApiProperty() @IsString() hospitalId!: string;
  @ApiProperty({ enum: BookingType }) @IsEnum(BookingType) type!: BookingType;
  @ApiProperty() @IsDateString() scheduledAt!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
