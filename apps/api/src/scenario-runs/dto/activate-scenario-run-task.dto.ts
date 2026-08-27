import { ApiProperty } from '@nestjs/swagger';

export class ActivateScenarioRunTaskDto {
  @ApiProperty({ example: 55.512345 })
  latitude!: number;

  @ApiProperty({ example: 9.712345 })
  longitude!: number;

  @ApiProperty({
    example: 12,
    description: 'GPS-nøjagtighed i meter',
  })
  accuracyMeters!: number;
}
