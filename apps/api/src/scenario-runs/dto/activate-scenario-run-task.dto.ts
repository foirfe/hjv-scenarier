import { IsNumber, Max, Min } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class ActivateScenarioRunTaskDto {
  @ApiProperty({
    example: 55.512345,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({
    example: 9.712345,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiProperty({
    example: 12,
    description: 'GPS-nøjagtighed i meter',
  })
  @IsNumber()
  @Min(0)
  @Max(10_000)
  accuracyMeters!: number;
}
