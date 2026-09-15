import { ApiProperty } from '@nestjs/swagger';

export class UpdateChecklistItemDto {
  @ApiProperty({
    example: true,
  })
  checked!: boolean;
}
