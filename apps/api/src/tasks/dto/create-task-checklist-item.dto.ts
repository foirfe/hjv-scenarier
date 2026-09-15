import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskChecklistItemDto {
  @ApiProperty({
    example: 'Kontrollér redningsvest',
  })
  itemText!: string;

  @ApiProperty({
    example: 0,
  })
  sortOrder!: number;
}
