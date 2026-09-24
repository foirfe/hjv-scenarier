import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScenarioRunDto {
  @ApiProperty({
    example: '8f47727e-2fc4-437d-b8c7-f525bdcc1813',
  })
  @IsUUID()
  scenarioId!: string;

  @ApiPropertyOptional({
    example: 'NAV I 17-09',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;
}
