import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateScenarioRunDto {
  @ApiPropertyOptional({
    example: 'NAV I Testafvikling',
    nullable: true,
  })
  name?: string | null;
}
