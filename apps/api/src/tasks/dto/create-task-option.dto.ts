import { IsBoolean, IsInt, IsString, Min, MinLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskOptionDto {
  @ApiProperty({
    example: 'Styrbord',
  })
  @IsString()
  @MinLength(1)
  optionText!: string;

  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  isCorrect!: boolean;

  @ApiProperty({
    example: 0,
  })
  @IsInt()
  @Min(0)
  sortOrder!: number;
}
