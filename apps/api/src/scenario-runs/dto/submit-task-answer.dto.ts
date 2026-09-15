import { ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitTaskAnswerDto {
  @ApiPropertyOptional({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  selectedOptionIds?: string[];

  @ApiPropertyOptional({
    example: 'Observationen viser...',
  })
  textAnswer?: string;
}
