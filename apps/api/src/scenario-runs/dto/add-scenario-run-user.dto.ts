import { IsEnum, IsUUID } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { ScenarioRole } from '../../../generated/prisma/client';

export class AddScenarioRunUserDto {
  @ApiProperty({
    example: '841b63c8-ef29-494e-9248-8048d6d89f16',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    enum: ScenarioRole,
    example: ScenarioRole.PARTICIPANT,
  })
  @IsEnum(ScenarioRole)
  role!: ScenarioRole;
}
