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
import { ApiTags } from '@nestjs/swagger';

import { ScenariosService } from './scenarios.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { UpdateScenarioDto } from './dto/update-scenario.dto';
import { AddScenarioTaskDto } from './dto/add-scenario-task.dto';
import { AddTaskDependencyDto } from './dto/add-task-dependency.dto';
import { UpdateScenarioTaskLocationDto } from './dto/update-scenario-task-location.dto';

@ApiTags('scenarios')
@Controller('scenarios')
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}
  //CREATE SCENARIO
  @Post()
  create(@Body() dto: CreateScenarioDto) {
    return this.scenariosService.create(dto);
  }
  //GET ALL SCENARIOS
  @Get()
  findAll() {
    return this.scenariosService.findAll();
  }
  //GET ONE SCENARIO
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.scenariosService.findOne(id);
  }
  //ADD TASK TO SCENARIO
  @Post(':scenarioId/tasks')
  addTask(
    @Param('scenarioId', ParseUUIDPipe) scenarioId: string,
    @Body() dto: AddScenarioTaskDto,
  ) {
    return this.scenariosService.addTask(scenarioId, dto);
  }
  //ADD DEPENDANCY TO SCENARIO
  @Post(':scenarioId/tasks/:scenarioTaskId/dependencies')
  addDependency(
    @Param('scenarioId', ParseUUIDPipe) scenarioId: string,
    @Param('scenarioTaskId', ParseUUIDPipe) scenarioTaskId: string,
    @Body() dto: AddTaskDependencyDto,
  ) {
    return this.scenariosService.addDependency(scenarioId, scenarioTaskId, dto);
  }
  //UPDATE TASK LOCATION
  @Patch(':scenarioId/tasks/:scenarioTaskId/location')
  updateTaskLocation(
    @Param('scenarioId', ParseUUIDPipe) scenarioId: string,
    @Param('scenarioTaskId', ParseUUIDPipe) scenarioTaskId: string,
    @Body() dto: UpdateScenarioTaskLocationDto,
  ) {
    return this.scenariosService.updateTaskLocation(
      scenarioId,
      scenarioTaskId,
      dto,
    );
  }
  //UPDATE SCENARIO
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScenarioDto,
  ) {
    return this.scenariosService.update(id, dto);
  }
  //DELETE/REMOVE SCENARIO
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.scenariosService.remove(id);
  }
}
