import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodGroup, BloodRequestUrgency } from '@medlink/shared';
import { Type } from 'class-transformer';

export class CreateBloodRequestDto {
  @ApiProperty({ enum: BloodGroup }) @IsEnum(BloodGroup) bloodGroup!: BloodGroup;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) unitsRequired?: number;
  @ApiPropertyOptional({ enum: BloodRequestUrgency }) @IsOptional() @IsEnum(BloodRequestUrgency) urgency?: BloodRequestUrgency;
}
