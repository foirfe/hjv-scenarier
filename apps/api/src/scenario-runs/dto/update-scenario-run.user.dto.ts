import { ApiProperty } from '@nestjs/swagger';
import { ScenarioRole } from '../../../generated/prisma/enums';

export class UpdateScenarioRunUserDto {
  @ApiProperty({
    enum: ScenarioRole,
    example: ScenarioRole.PARTICIPANT,
  })
  role!: ScenarioRole;
}
