import { AnswerType, TaskStatus } from '../../../generated/prisma/client';

export class CreateTaskDto {
  name!: string;
  description?: string;
  instructions!: string;

  environmentId!: number;
  taskTypeId!: number;

  status!: TaskStatus;
  answerType?: AnswerType;
}
