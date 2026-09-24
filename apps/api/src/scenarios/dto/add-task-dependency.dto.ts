import { IsUUID } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class AddTaskDependencyDto {
  @ApiProperty()
  @IsUUID()
  prerequisiteTaskId!: string;
}
