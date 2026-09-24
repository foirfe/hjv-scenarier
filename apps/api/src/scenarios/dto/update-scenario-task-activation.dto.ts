import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ActivationMode } from '../../../generated/prisma/enums';

export class UpdateScenarioTaskActivationDto {
  @ApiProperty({
    enum: ActivationMode,
  })
  @IsEnum(ActivationMode)
  activationMode!: ActivationMode;

  @ApiPropertyOptional({
    example: 55.512345,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    example: 9.712345,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    example: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  radiusMeters?: number;
}
