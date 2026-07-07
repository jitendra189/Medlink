import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateResourcesDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) icuBedsTotal?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) icuBedsAvailable?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) totalDoctors?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) ambulancesTotal?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) ambulancesAvailable?: number;
}
