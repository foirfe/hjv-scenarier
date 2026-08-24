import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin01' })
  username!: string;

  @ApiProperty({ example: 'Test1234!' })
  password!: string;
}
