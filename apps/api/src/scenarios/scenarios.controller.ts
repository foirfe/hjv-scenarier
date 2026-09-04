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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ScenariosService } from './scenarios.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { UpdateScenarioDto } from './dto/update-scenario.dto';
import { AddScenarioTaskDto } from './dto/add-scenario-task.dto';
import { AddTaskDependencyDto } from './dto/add-task-dependency.dto';
import { UpdateScenarioTaskActivationDto } from './dto/update-scenario-task-activation.dto';
import { UserRole } from '../../generated/prisma/enums';
import { Roles } from '@/auth/decorators/roles.decorator';

@ApiTags('scenarios')
@ApiBearerAuth()
@Controller('scenarios')
@Roles(UserRole.ADMIN)
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}
  //CREATE SCENARIO
  @Post()
  @ApiOperation({
    summary: 'Opret et nyt scenarie',
    description: 'Opretter en ny scenariomodel i systemet.',
  })
  @ApiResponse({ status: 201, description: 'Scenariet blev oprettet.' })
  @ApiResponse({ status: 400, description: 'Ugyldig input data.' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  create(@Body() dto: CreateScenarioDto) {
    return this.scenariosService.create(dto);
  }
  //GET ALL SCENARIOS
  @Get()
  @ApiOperation({
    summary: 'Hent alle scenarier',
    description: 'Returnerer en liste over alle tilgængelige scenarier.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listen over scenarier blev hentet.',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  findAll() {
    return this.scenariosService.findAll();
  }
  //GET ONE SCENARIO
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({
    summary: 'Hent et specifikt scenarie',
    description:
      'Henter detaljer og opgaver for et enkelt scenarie baseret på dets UUID.',
  })
  @ApiParam({ name: 'id', description: 'UUID på scenariet' })
  @ApiResponse({
    status: 200,
    description: 'Scenariet blev fundet og returneret.',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({ status: 404, description: 'Scenariet blev ikke fundet.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.scenariosService.findOne(id);
  }
  //TILFØJ TASK TIL SCENARIE
  @Post(':scenarioId/tasks')
  @ApiOperation({
    summary: 'Tilføj opgave til scenarie',
    description: 'Tilføjer en ny opgave til det specificerede scenarie.',
  })
  @ApiParam({ name: 'scenarioId', description: 'UUID på scenariet' })
  @ApiResponse({
    status: 201,
    description: 'Opgaven blev tilføjet til scenariet.',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({ status: 404, description: 'Scenariet blev ikke fundet.' })
  addTask(
    @Param('scenarioId', ParseUUIDPipe) scenarioId: string,
    @Body() dto: AddScenarioTaskDto,
  ) {
    return this.scenariosService.addTask(scenarioId, dto);
  }
  //FJERN TASK FRA SCENARIE
  @Delete(':scenarioId/tasks/:scenarioTaskId')
  @ApiOperation({
    summary: 'Fjern opgave fra scenarie',
    description: 'Fjerner en opgave fra det valgte scenarie.',
  })
  removeTask(
    @Param('scenarioId', ParseUUIDPipe)
    scenarioId: string,

    @Param('scenarioTaskId', ParseUUIDPipe)
    scenarioTaskId: string,
  ) {
    return this.scenariosService.removeTask(scenarioId, scenarioTaskId);
  }
  //ADD DEPENDANCY TO SCENARIO
  @Post(':scenarioId/tasks/:scenarioTaskId/dependencies')
  @ApiOperation({
    summary: 'Tilføj afhængighed til en opgave',
    description:
      'Opretter en afhængighed mellem en specifik opgave og en anden opgave i scenariet.',
  })
  @ApiParam({ name: 'scenarioId', description: 'UUID på scenariet' })
  @ApiParam({
    name: 'scenarioTaskId',
    description: 'UUID på den opgave der får en afhængighed',
  })
  @ApiResponse({ status: 201, description: 'Afhængigheden blev oprettet.' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({
    status: 404,
    description: 'Scenariet eller opgaven blev ikke fundet.',
  })
  addDependency(
    @Param('scenarioId', ParseUUIDPipe) scenarioId: string,
    @Param('scenarioTaskId', ParseUUIDPipe) scenarioTaskId: string,
    @Body() dto: AddTaskDependencyDto,
  ) {
    return this.scenariosService.addDependency(scenarioId, scenarioTaskId, dto);
  }
  //UPDATE TASK LOCATION
  @Patch(':scenarioId/tasks/:scenarioTaskId/activation')
  @ApiOperation({
    summary: 'Opdater aktiverin for en opgave',
    description:
      'Opdaterer hvordan en opgave frigives, og ved behov den geografiske eller logiske placering for en specifik opgave.',
  })
  @ApiParam({ name: 'scenarioId', description: 'UUID på scenariet' })
  @ApiParam({
    name: 'scenarioTaskId',
    description: 'UUID på opgaven der skal opdateres',
  })
  @ApiResponse({
    status: 200,
    description: 'Opgavens aktivering blev opdateret.',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({
    status: 404,
    description: 'Scenariet eller opgaven blev ikke fundet.',
  })
  updateTaskActivation(
    @Param('scenarioId', ParseUUIDPipe) scenarioId: string,
    @Param('scenarioTaskId', ParseUUIDPipe) scenarioTaskId: string,
    @Body() dto: UpdateScenarioTaskActivationDto,
  ) {
    return this.scenariosService.updateTaskActivation(
      scenarioId,
      scenarioTaskId,
      dto,
    );
  }
  //UPDATE SCENARIO
  @Patch(':id')
  @ApiOperation({
    summary: 'Opdater et scenarie',
    description: 'Opdaterer stamdata for et eksisterende scenarie.',
  })
  @ApiParam({ name: 'id', description: 'UUID på scenariet der skal opdateres' })
  @ApiResponse({ status: 200, description: 'Scenariet blev opdateret.' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({ status: 404, description: 'Scenariet blev ikke fundet.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScenarioDto,
  ) {
    return this.scenariosService.update(id, dto);
  }
  //DELETE/REMOVE SCENARIO
  @Delete(':id')
  @ApiOperation({
    summary: 'Slet et scenarie',
    description: 'Fjerner et scenarie og dets tilhørende data fra systemet.',
  })
  @ApiParam({ name: 'id', description: 'UUID på scenariet der skal slettes' })
  @ApiResponse({ status: 200, description: 'Scenariet blev slettet.' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({ status: 404, description: 'Scenariet blev ikke fundet.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.scenariosService.remove(id);
  }
  @Delete(':scenarioId/tasks/:scenarioTaskId/dependencies/:prerequisiteTaskId')
  @ApiOperation({
    summary: 'Fjern afhængighed fra en opgave',
  })
  removeDependency(
    @Param('scenarioTaskId', ParseUUIDPipe)
    scenarioTaskId: string,

    @Param('prerequisiteTaskId', ParseUUIDPipe)
    prerequisiteTaskId: string,
  ) {
    return this.scenariosService.removeDependency(
      scenarioTaskId,
      prerequisiteTaskId,
    );
  }
}
