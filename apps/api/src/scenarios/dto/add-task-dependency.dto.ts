import { ApiProperty } from '@nestjs/swagger';

export class AddTaskDependencyDto {
  @ApiProperty()
  prerequisiteTaskId!: string;
}
