import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class HospitalFiltersDto {
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean() icuAvailable?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() lat?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() lng?: number;
  @ApiPropertyOptional({ default: 25 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(100) radiusKm?: number;
}
