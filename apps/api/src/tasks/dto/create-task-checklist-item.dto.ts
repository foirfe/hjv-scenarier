import { IsInt, IsString, Min, MinLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskChecklistItemDto {
  @ApiProperty({
    example: 'Kontrollér redningsvest',
  })
  @IsString()
  @MinLength(1)
  itemText!: string;

  @ApiProperty({
    example: 0,
  })
  @IsInt()
  @Min(0)
  sortOrder!: number;
}
