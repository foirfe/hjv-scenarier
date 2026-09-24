import { IsBoolean } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class UpdateChecklistItemDto {
  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  checked!: boolean;
}
