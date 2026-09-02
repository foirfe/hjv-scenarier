import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskOptionDto {
  @ApiProperty({
    example: 'Styrbord',
  })
  optionText!: string;

  @ApiProperty({
    example: true,
  })
  isCorrect!: boolean;

  @ApiProperty({
    example: 0,
  })
  sortOrder!: number;
}
