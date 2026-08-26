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

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UserRole } from '../../generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';

import { CreateScenarioRunDto } from './dto/create-scenario-run.dto';
import { AddScenarioRunUserDto } from './dto/add-scenario-run-user.dto';
import { ScenarioRunsService } from './scenario-runs.service';
import { RemoveScenarioRunUserDto } from './dto/remove-scenario-run-user.dto';
import { UpdateScenarioRunUserDto } from './dto/update-scenario-run.user.dto';

@ApiTags('scenario-runs')
@ApiBearerAuth()
@Controller('scenario-runs')
export class ScenarioRunsController {
  constructor(private readonly scenarioRunsService: ScenarioRunsService) {}
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateScenarioRunDto) {
    return this.scenarioRunsService.create(dto);
  }
  //Add Scenario Run User
  @Post(':runId/users')
  @Roles(UserRole.ADMIN)
  addUser(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Body() dto: AddScenarioRunUserDto,
  ) {
    return this.scenarioRunsService.addUser(runId, dto);
  }
  //Update Scenario Run User Role
  @Patch('/:runId/user/:userId')
  @Roles(UserRole.ADMIN)
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
  removeUser(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Body() dto: RemoveScenarioRunUserDto,
  ) {
    return this.scenarioRunsService.removeScenarioRunUser(runId, dto);
  }
  //GET Scenario Run
  @Get(':runId')
  findOne(@Param('runId', ParseUUIDPipe) runId: string) {
    return this.scenarioRunsService.findOne(runId);
  }
  @Patch(':runId/start')
  @Roles(UserRole.ADMIN) //SENERE SKAL INSTRUCTOR/TEAMLEADER OGSÅ KUNNE STARTE SCENARIO RUN
  start(@Param('runId', ParseUUIDPipe) runId: string) {
    return this.scenarioRunsService.start(runId);
  }
}
