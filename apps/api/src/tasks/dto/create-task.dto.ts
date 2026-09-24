import { Type } from 'class-transformer';

import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AnswerType, TaskStatus } from '../../../generated/prisma/client';

import { CreateTaskOptionDto } from './create-task-option.dto';

import { CreateTaskChecklistItemDto } from './create-task-checklist-item.dto';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Mand over bord',
  })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({
    example: 'Træning i håndtering af mand over bord',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'Følg proceduren for mand over bord.',
  })
  @IsString()
  @MinLength(1)
  instructions!: string;

  @ApiPropertyOptional({
    example: 'Efter 30 sekunder meddeles det, at røgen tiltager.',
  })
  @IsOptional()
  @IsString()
  instructorInstructions?: string;

  @ApiProperty({
    example: 1,
  })
  @IsInt()
  @Min(1)
  environmentId!: number;

  @ApiProperty({
    example: 1,
  })
  @IsInt()
  @Min(1)
  taskTypeId!: number;

  @ApiProperty({
    enum: TaskStatus,
    example: TaskStatus.ACTIVE,
  })
  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @ApiPropertyOptional({
    enum: AnswerType,
  })
  @IsOptional()
  @IsEnum(AnswerType)
  answerType?: AnswerType;

  @ApiPropertyOptional({
    type: [CreateTaskOptionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => CreateTaskOptionDto)
  options?: CreateTaskOptionDto[];

  @ApiPropertyOptional({
    type: [CreateTaskChecklistItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => CreateTaskChecklistItemDto)
  checklistItems?: CreateTaskChecklistItemDto[];
}
