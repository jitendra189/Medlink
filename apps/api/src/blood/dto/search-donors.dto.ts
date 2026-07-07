import { IsEnum, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BloodGroup } from '@medlink/shared';
import { Type } from 'class-transformer';

export class SearchDonorsDto {
  @ApiPropertyOptional({ enum: BloodGroup }) @IsOptional() @IsEnum(BloodGroup) bloodGroup?: BloodGroup;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() lat?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() lng?: number;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(50) limit?: number;
}
