import { ApiProperty } from '@nestjs/swagger';

export class UpdateScenarioTaskLocationDto {
  @ApiProperty({ example: 55.512345 })
  latitude!: number;

  @ApiProperty({ example: 9.712345 })
  longitude!: number;

  @ApiProperty({ example: 100 })
  radiusMeters!: number;
}
