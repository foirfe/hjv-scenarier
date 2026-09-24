import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ScenarioStatus } from '../../../generated/prisma/client';

export class CreateScenarioDto {
  @ApiProperty({
    example: 'NAV I 2026',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    example: 'Maritim træningsøvelse ved Lillebælt',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    enum: ScenarioStatus,
    default: ScenarioStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ScenarioStatus)
  status?: ScenarioStatus;
}
