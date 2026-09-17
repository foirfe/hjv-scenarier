import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UserRole } from '../../generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';

import { CreateScenarioRunDto } from './dto/create-scenario-run.dto';
import { UpdateScenarioRunDto } from './dto/update-scenario-run.dto';
import { AddScenarioRunUserDto } from './dto/add-scenario-run-user.dto';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { ScenarioRunsService } from './scenario-runs.service';
import { RemoveScenarioRunUserDto } from './dto/remove-scenario-run-user.dto';
import { UpdateScenarioRunUserDto } from './dto/update-scenario-run.user.dto';
import { ActivateScenarioRunTaskDto } from './dto/activate-scenario-run-task.dto';
import { SubmitTaskAnswerDto } from './dto/submit-task-answer.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';

@ApiTags('scenario-runs')
@ApiBearerAuth()
@Controller('scenario-runs')
export class ScenarioRunsController {
  constructor(private readonly scenarioRunsService: ScenarioRunsService) {}
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Opret et nyt scenario run',
    description:
      'Opretter en ny afvikling af et valgt scenarie. Kræver ADMIN-rolle.',
  })
  @ApiResponse({ status: 201, description: 'Scenario run blev oprettet.' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({
    status: 403,
    description: 'Adgang nægtet (mangler ADMIN-rolle).',
  })
  create(@Body() dto: CreateScenarioRunDto) {
    return this.scenarioRunsService.create(dto);
  }
  //OPDATERE SCENARIE AFVIKLING
  @Patch(':runId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Opdatér scenario run',
  })
  update(
    @Param('runId', ParseUUIDPipe)
    runId: string,

    @Body()
    dto: UpdateScenarioRunDto,
  ) {
    return this.scenarioRunsService.update(runId, dto);
  }
  //Add Scenario Run User
  @Post(':runId/users')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Tilføj bruger til scenario run',
    description:
      'Tilknytter en bruger med en specifik rolle til det valgte scenario run.',
  })
  @ApiParam({ name: 'runId', description: 'UUID på det gældende scenario run' })
  @ApiResponse({ status: 200, description: 'Bruger tilføjet succesfuldt.' })
  @ApiResponse({ status: 404, description: 'Scenario run blev ikke fundet.' })
  addUser(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Body() dto: AddScenarioRunUserDto,
  ) {
    return this.scenarioRunsService.addUser(runId, dto);
  }
  //Update Scenario Run User Role
  @Patch('/:runId/user/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Opdater brugers rolle i et scenario run',
    description:
      'Ændrer den tildelte rolle for en specifik bruger i afviklingen.',
  })
  @ApiParam({ name: 'runId', description: 'UUID på det gældende scenario run' })
  @ApiParam({ name: 'userId', description: 'UUID på brugeren' })
  @ApiResponse({ status: 200, description: 'Brugerens rolle opdateret.' })
  @ApiResponse({
    status: 404,
    description: 'Bruger eller run blev ikke fundet.',
  })
  updateUser(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateScenarioRunUserDto,
  ) {
    return this.scenarioRunsService.updateScenarioRunUser(runId, userId, dto);
  }
  //Remove Scenario Run User
  @Delete(':runId/user')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Fjern bruger fra scenario run',
    description: 'Fjerner en bruger fra det specificerede scenario run.',
  })
  @ApiParam({ name: 'runId', description: 'UUID på det gældende scenario run' })
  @ApiResponse({ status: 200, description: 'Bruger fjernet fra scenario run.' })
  @ApiResponse({ status: 404, description: 'Scenario run blev ikke fundet.' })
  removeUser(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Body() dto: RemoveScenarioRunUserDto,
  ) {
    return this.scenarioRunsService.removeScenarioRunUser(runId, dto);
  }
  //HENT ALLE SCENARIE RUNS FOR BRUGER
  @Get('me')
  @ApiOperation({
    summary: 'Hent mine scenario runs',
    description:
      'Returnerer de scenario runs den indloggede bruger er tilknyttet.',
  })
  findMyRuns(@Req() request: AuthenticatedRequest) {
    return this.scenarioRunsService.findMyRuns(request.user.sub);
  }
  //GET ME FRA SCENARIE RUN
  @Get(':runId/me')
  @ApiOperation({
    summary: 'Hent min scenario run',
    description:
      'Henter scenario run, rolle og task-progress for den indloggede bruger.',
  })
  findMe(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.scenarioRunsService.findMe(runId, request.user.sub);
  }
  //GET Scenario Run
  @Get(':runId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Hent et scenario run',
    description:
      'Henter detaljeret information samt status for et specifikt scenario run. Kræver ADMIN-rolle',
  })
  @ApiParam({ name: 'runId', description: 'UUID på det ønskede scenario run' })
  @ApiResponse({
    status: 200,
    description: 'Scenario run fundet og returneret.',
  })
  @ApiResponse({ status: 404, description: 'Scenario run blev ikke fundet.' })
  findOne(@Param('runId', ParseUUIDPipe) runId: string) {
    return this.scenarioRunsService.findOne(runId);
  }
  @Patch(':runId/start')
  @ApiOperation({
    summary: 'Start et scenario run',
    description: 'Sætter status for scenario run til aktiv/startet.',
  })
  @ApiParam({
    name: 'runId',
    description: 'UUID på det scenario run der skal startes',
  })
  @ApiResponse({ status: 200, description: 'Scenario run er startet.' })
  @ApiResponse({
    status: 400,
    description: 'Scenario run kan ikke startes i sin nuværende tilstand.',
  })
  @Roles(UserRole.ADMIN) //SENERE SKAL INSTRUCTOR/TEAMLEADER OGSÅ KUNNE STARTE SCENARIO RUN
  start(@Param('runId', ParseUUIDPipe) runId: string) {
    return this.scenarioRunsService.start(runId);
  }
  //GET AF ALLE SCENARIERUNS
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Hent alle scenario runs',
    description: 'Returnerer alle scenarieafviklinger.',
  })
  findAll() {
    return this.scenarioRunsService.findAll();
  }
  @Patch(':runId/tasks/:runTaskId/activate')
  @ApiOperation({
    summary: 'Aktivere en opgave',
    description: 'Aktiverer en opgave udfra GPS lokation.',
  })
  @ApiParam({
    name: 'runId',
    description: 'UUID på det scenario run der skal startes',
  })
  @ApiResponse({ status: 200, description: 'Scenario run er startet.' })
  @ApiResponse({
    status: 400,
    description: 'Scenario run kan ikke startes i sin nuværende tilstand.',
  })
  activateTask(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Param('runTaskId', ParseUUIDPipe) runTaskId: string,
    @Body() dto: ActivateScenarioRunTaskDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.scenarioRunsService.activateTask(
      runId,
      runTaskId,
      request.user.sub,
      dto,
    );
  }
  @Post(':runId/tasks/:runTaskId/answer')
  @ApiOperation({
    summary: 'Besvar en opgave',
    description:
      'Gemmer og validerer den indloggede brugers svar på en aktiv opgave.',
  })
  submitAnswer(
    @Param('runId', ParseUUIDPipe)
    runId: string,

    @Param('runTaskId', ParseUUIDPipe)
    runTaskId: string,

    @Body()
    dto: SubmitTaskAnswerDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.scenarioRunsService.submitAnswer(
      runId,
      runTaskId,
      request.user.sub,
      dto,
    );
  }
  @Patch(':runId/tasks/:runTaskId/complete')
  @ApiOperation({
    summary: 'Marker en opgave som udført',
    description:
      'Marker en specifik opgave i et scenario run som færdig for den indloggede bruger.',
  })
  @ApiParam({ name: 'runId', description: 'UUID på det gældende scenario run' })
  @ApiParam({ name: 'runTaskId', description: 'UUID på opgaven der fuldføres' })
  @ApiResponse({
    status: 200,
    description: 'Opgaven blev markeret som udført.',
  })
  @ApiResponse({
    status: 404,
    description: 'Opgaven eller afviklingen blev ikke fundet.',
  })
  completeTask(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Param('runTaskId', ParseUUIDPipe) runTaskId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.scenarioRunsService.completeTask(
      runId,
      runTaskId,
      request.user.sub,
    );
  }
  @Patch(':runId/tasks/:runTaskId/activate-manual/:targetUserId')
  activateTaskManually(
    @Param('runId', ParseUUIDPipe)
    runId: string,

    @Param('runTaskId', ParseUUIDPipe)
    runTaskId: string,

    @Param('targetUserId', ParseUUIDPipe)
    targetUserId: string,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.scenarioRunsService.activateTaskManually(
      runId,
      runTaskId,
      request.user.sub,
      targetUserId,
    );
  }
  @Patch(':runId/tasks/:runTaskId/checklist/:itemId')
  @ApiOperation({
    summary: 'Opdater punkt på tjekliste',
    description:
      'Afkrydser eller fjerner afkrydsning på et checklist-punkt for den indloggede bruger.',
  })
  updateChecklistItem(
    @Param('runId', ParseUUIDPipe)
    runId: string,

    @Param('runTaskId', ParseUUIDPipe)
    runTaskId: string,

    @Param('itemId', ParseUUIDPipe)
    itemId: string,

    @Body()
    dto: UpdateChecklistItemDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.scenarioRunsService.updateChecklistItem(
      runId,
      runTaskId,
      itemId,
      request.user.sub,
      dto,
    );
  }
}
