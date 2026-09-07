import { ApiPropertyOptional } from '@nestjs/swagger';

import { UserRole, UserStatus } from '../../../generated/prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Mads Kristiansen',
  })
  displayName?: string;

  @ApiPropertyOptional({
    enum: UserRole,
  })
  role?: UserRole;

  @ApiPropertyOptional({
    enum: UserStatus,
  })
  status?: UserStatus;
}
