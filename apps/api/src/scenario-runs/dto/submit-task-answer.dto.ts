import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitTaskAnswerDto {
  @ApiPropertyOptional({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, {
    each: true,
  })
  selectedOptionIds?: string[];

  @ApiPropertyOptional({
    example: 'Observationen viser...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  textAnswer?: string;
}
