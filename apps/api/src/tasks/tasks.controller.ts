import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/enums';
import { Roles } from '@/auth/decorators/roles.decorator';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Hent alle opgaver',
    description:
      'Returnerer en liste over alle opgaver i systemet. Kræver ADMIN-rolle.',
  })
  @ApiResponse({ status: 200, description: 'Listen over opgaver blev hentet.' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({
    status: 403,
    description: 'Adgang nægtet (mangler ADMIN-rolle).',
  })
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Hent en specifik opgave',
    description: 'Henter detaljer for en enkelt opgave baseret på dens UUID.',
  })
  @ApiParam({ name: 'id', description: 'UUID på den ønskede opgave' })
  @ApiResponse({
    status: 200,
    description: 'Opgaven blev fundet og returneret.',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({ status: 404, description: 'Opgaven blev ikke fundet.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Opret en ny opgave',
    description: 'Opretter en ny opgaveregistrering. Kræver ADMIN-rolle.',
  })
  @ApiResponse({ status: 201, description: 'Opgaven blev oprettet.' })
  @ApiResponse({ status: 400, description: 'Ugyldig input data.' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({
    status: 403,
    description: 'Adgang nægtet (mangler ADMIN-rolle).',
  })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Opdater en opgave',
    description:
      'Opdaterer stamdata for en eksisterende opgave. Kræver ADMIN-rolle.',
  })
  @ApiParam({ name: 'id', description: 'UUID på opgaven der skal opdateres' })
  @ApiResponse({ status: 200, description: 'Opgaven blev opdateret.' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({
    status: 403,
    description: 'Adgang nægtet (mangler ADMIN-rolle).',
  })
  @ApiResponse({ status: 404, description: 'Opgaven blev ikke fundet.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Slet en opgave',
    description: 'Fjerner en opgave fra systemet. Kræver ADMIN-rolle.',
  })
  @ApiParam({ name: 'id', description: 'UUID på opgaven der skal slettes' })
  @ApiResponse({ status: 200, description: 'Opgaven blev slettet.' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({
    status: 403,
    description: 'Adgang nægtet (mangler ADMIN-rolle).',
  })
  @ApiResponse({ status: 404, description: 'Opgaven blev ikke fundet.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.remove(id);
  }
}
