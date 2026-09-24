import { IsOptional, IsString, MaxLength } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateScenarioRunDto {
  @ApiPropertyOptional({
    example: 'NAV I Testafvikling',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string | null;
}
