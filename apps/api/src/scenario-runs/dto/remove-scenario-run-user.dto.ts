import { IsUUID } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class RemoveScenarioRunUserDto {
  @ApiProperty({
    example: '8f47727e-2fc4-437d-b8c7-f525bdcc1813',
  })
  @IsUUID()
  userId!: string;
}
