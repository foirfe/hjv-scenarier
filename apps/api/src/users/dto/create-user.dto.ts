import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { UserRole } from '../../../generated/prisma/client';

export class CreateUserDto {
  @ApiProperty({
    example: 'deltager01',
  })
  @IsString()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'Brugernavn må kun indeholde bogstaver, tal, punktum, bindestreg og underscore',
  })
  username!: string;

  @ApiProperty({
    example: 'Mads Kristiansen',
  })
  @IsString()
  @Length(2, 100)
  displayName!: string;

  @ApiProperty({
    example: 'Dette er en lang adgangskode!',
    minLength: 15,
    maxLength: 128,
  })
  @IsString()
  @MinLength(15, {
    message: 'Adgangskoden skal være mindst 15 tegn',
  })
  @MaxLength(128, {
    message: 'Adgangskoden må højst være 128 tegn',
  })
  password!: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
