import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../generated/prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'deltager01' })
  username!: string;

  @ApiProperty({ example: 'Mads Kristiansen' })
  displayName!: string;

  @ApiProperty({ example: 'Test1234!' })
  password!: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.USER,
  })
  role?: UserRole;
}