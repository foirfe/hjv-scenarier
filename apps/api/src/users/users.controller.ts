import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { UserRole } from '../../generated/prisma/enums';
import { Roles } from '@/auth/decorators/roles.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post()
  @ApiOperation({
    summary: 'Opret en ny bruger',
    description: 'Opretter en ny bruger i systemet. Kræver ADMIN-rolle.',
  })
  @ApiResponse({
    status: 201,
    description: 'Brugeren blev oprettet succesfuldt.',
  })
  @ApiResponse({ status: 400, description: 'Ugyldig input data.' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({
    status: 403,
    description: 'Adgang nægtet (mangler ADMIN-rolle).',
  })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Hent alle brugere',
    description:
      'Returnerer en liste over alle registrerede brugere. Kræver ADMIN-rolle.',
  })
  @ApiResponse({ status: 200, description: 'Listen over brugere blev hentet.' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({
    status: 403,
    description: 'Adgang nægtet (mangler ADMIN-rolle).',
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Hent en specifik bruger',
    description:
      'Henter detaljer for en enkelt bruger baseret på deres UUID. Kræver ADMIN-rolle.',
  })
  @ApiParam({ name: 'id', description: 'UUID på den ønskede bruger' })
  @ApiResponse({
    status: 200,
    description: 'Brugeren blev fundet og returneret.',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({
    status: 403,
    description: 'Adgang nægtet (mangler ADMIN-rolle).',
  })
  @ApiResponse({ status: 404, description: 'Brugeren blev ikke fundet.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }
}
