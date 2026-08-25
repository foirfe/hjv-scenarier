import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UserRole } from '../../generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';

import { CreateScenarioRunDto } from './dto/create-scenario-run.dto';
import { AddScenarioRunUserDto } from './dto/add-scenario-run-user.dto';
import { ScenarioRunsService } from './scenario-runs.service';

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

  @Post(':runId/users')
  @Roles(UserRole.ADMIN)
  addUser(
    @Param('runId', ParseUUIDPipe) runId: string,
    @Body() dto: AddScenarioRunUserDto,
  ) {
    return this.scenarioRunsService.addUser(runId, dto);
  }
}
