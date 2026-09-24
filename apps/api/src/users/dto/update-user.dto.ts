import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

import { UserRole, UserStatus } from '../../../generated/prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Mads Kristiansen',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  displayName?: string;

  @ApiPropertyOptional({
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
