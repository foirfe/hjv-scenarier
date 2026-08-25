import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { UpdateScenarioDto } from './dto/update-scenario.dto';
import { AddScenarioTaskDto } from './dto/add-scenario-task.dto';
import { AddTaskDependencyDto } from './dto/add-task-dependency.dto';
import { UpdateScenarioTaskLocationDto } from './dto/update-scenario-task-location.dto';

@Injectable()
export class ScenariosService {
  constructor(private readonly prisma: PrismaService) {}
  //CREATE SCENARIO
  create(dto: CreateScenarioDto) {
    return this.prisma.scenario.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status ?? 'DRAFT',
      },
    });
  }
  //GET ALL SCENARIOS
  findAll() {
    return this.prisma.scenario.findMany();
  }
  //GET ONE SCENARIO
  async findOne(id: string) {
    const scenario = await this.prisma.scenario.findUnique({
      where: { id },

      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,

        scenarioTasks: {
          select: {
            id: true,
            latitude: true,
            longitude: true,
            radiusMeters: true,

            task: {
              select: {
                id: true,
                name: true,
                description: true,
                instructions: true,
                status: true,
                answerType: true,
                environmentId: true,
                taskTypeId: true,
              },
            },

            dependencies: {
              select: {
                prerequisiteTaskId: true,
              },
            },
          },
        },
      },
    });
    return scenario;
  }
  //UPDATE SCENARIO
  update(id: string, dto: UpdateScenarioDto) {
    return this.prisma.scenario.update({
      where: { id },
      data: dto,
    });
  }
  //ADD TASK TO SCENARIO
  addTask(scenarioId: string, dto: AddScenarioTaskDto) {
    return this.prisma.scenarioTask.create({
      data: {
        scenarioId,
        taskId: dto.taskId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radiusMeters: dto.radiusMeters,
      },
      include: {
        task: true,
      },
    });
  }
  //ADD DEPENDANCY TO TASK IN SCENARIO
  async addDependency(
    scenarioId: string,
    scenarioTaskId: string,
    dto: AddTaskDependencyDto,
  ) {
    const scenarioTask = await this.prisma.scenarioTask.findFirst({
      where: {
        id: scenarioTaskId,
        scenarioId,
      },
    });

    if (!scenarioTask) {
      throw new NotFoundException('Opgaven findes ikke i scenariet');
    }

    const prerequisite = await this.prisma.scenarioTask.findFirst({
      where: {
        id: dto.prerequisiteTaskId,
        scenarioId,
      },
    });

    if (!prerequisite) {
      throw new NotFoundException(
        'Forudsætningsopgaven findes ikke i scenariet',
      );
    }

    if (scenarioTaskId === dto.prerequisiteTaskId) {
      throw new BadRequestException(
        'En opgave kan ikke være afhængig af sig selv',
      );
    }

    return this.prisma.scenarioTaskDependency.create({
      data: {
        scenarioTaskId,
        prerequisiteTaskId: dto.prerequisiteTaskId,
      },
    });
  }
  //REMOVE DEPENDENCY FROM TASK IN SCENARIO
  async removeDependency(scenarioTaskId: string, prerequisiteTaskId: string) {
    return this.prisma.scenarioTaskDependency.delete({
      where: {
        scenarioTaskId_prerequisiteTaskId: {
          scenarioTaskId,
          prerequisiteTaskId,
        },
      },
    });
  }
  //UPDATE TASK LOCATION
  async updateTaskLocation(
    scenarioId: string,
    scenarioTaskId: string,
    dto: UpdateScenarioTaskLocationDto,
  ) {
    const scenarioTask = await this.prisma.scenarioTask.findFirst({
      where: {
        id: scenarioTaskId,
        scenarioId,
      },
    });

    if (!scenarioTask) {
      throw new NotFoundException('Opgaven findes ikke i scenariet');
    }

    return this.prisma.scenarioTask.update({
      where: {
        id: scenarioTaskId,
      },
      data: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        radiusMeters: dto.radiusMeters,
      },
    });
  }
  //DELETE SCENARIO
  remove(id: string) {
    return this.prisma.scenario.delete({
      where: { id },
    });
  }
}
