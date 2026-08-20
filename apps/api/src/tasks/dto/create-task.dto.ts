import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnswerType, TaskStatus } from '../../../generated/prisma/client';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Mand over bord',
  })
  name!: string;

  @ApiPropertyOptional({
    example: 'Træning i håndtering af mand over bord',
  })
  description?: string;

  @ApiProperty({
    example: 'Følg proceduren for mand over bord.',
  })
  instructions!: string;

  @ApiProperty({
    example: 1,
  })
  environmentId!: number;

  @ApiProperty({
    example: 1,
  })
  taskTypeId!: number;

  @ApiProperty({
    enum: TaskStatus,
    example: TaskStatus.ACTIVE,
  })
  status!: TaskStatus;

  @ApiPropertyOptional({
    enum: AnswerType,
  })
  answerType?: AnswerType;
}
