import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ActivationMode } from '../../../generated/prisma/enums';

export class UpdateScenarioTaskActivationDto {
  @ApiProperty({
    enum: ActivationMode,
  })
  activationMode!: ActivationMode;

  @ApiPropertyOptional({
    example: 55.512345,
  })
  latitude?: number;

  @ApiPropertyOptional({
    example: 9.712345,
  })
  longitude?: number;

  @ApiPropertyOptional({
    example: 100,
  })
  radiusMeters?: number;
}
