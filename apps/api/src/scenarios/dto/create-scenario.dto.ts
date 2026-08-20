import { ScenarioStatus } from '../../../generated/prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScenarioDto {
  @ApiProperty({
    example: 'NAV I 2026',
  })
  name!: string;

  @ApiPropertyOptional({
    example: 'Maritim træningsøvelse ved Lillebælt',
  })
  description?: string;

  @ApiPropertyOptional({
    enum: ScenarioStatus,
    default: ScenarioStatus.DRAFT,
  })
  status?: ScenarioStatus;
}
