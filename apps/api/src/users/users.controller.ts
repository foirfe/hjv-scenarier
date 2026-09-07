import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { UpdateUserDto } from './dto/update-user.dto';
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
  @Patch(':id')
  @ApiOperation({
    summary: 'Opdater en bruger',
    description: 'Opdaterer navn, systemrolle eller status på en bruger.',
  })
  @ApiResponse({
    status: 200,
    description: 'Brugeren blev opdateret.',
  })
  @ApiResponse({
    status: 404,
    description: 'Brugeren blev ikke fundet.',
  })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
