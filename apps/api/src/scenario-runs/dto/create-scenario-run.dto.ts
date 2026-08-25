import { ApiProperty } from '@nestjs/swagger';

export class CreateScenarioRunDto {
  @ApiProperty({
    example: '8f47727e-2fc4-437d-b8c7-f525bdcc1813',
  })
  scenarioId!: string;
}
