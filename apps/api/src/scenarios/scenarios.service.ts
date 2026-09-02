import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ActivationMode } from '../../generated/prisma/enums';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { UpdateScenarioDto } from './dto/update-scenario.dto';
import { AddScenarioTaskDto } from './dto/add-scenario-task.dto';
import { AddTaskDependencyDto } from './dto/add-task-dependency.dto';
import { UpdateScenarioTaskActivationDto } from './dto/update-scenario-task-activation.dto';

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
    return this.prisma.scenario.findMany({
      include: {
        _count: {
          select: {
            scenarioTasks: true,
          },
        },
      },

      orderBy: {
        updatedAt: 'desc',
      },
    });
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
            activationMode: true,
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
    const activationMode = dto.activationMode ?? ActivationMode.GEO;

    if (activationMode === ActivationMode.GEO) {
      if (
        dto.latitude === undefined ||
        dto.longitude === undefined ||
        dto.radiusMeters === undefined
      ) {
        throw new BadRequestException(
          'GEO-opgaver skal have latitude, longitude og radiusMeters',
        );
      }

      if (dto.radiusMeters <= 0) {
        throw new BadRequestException('radiusMeters skal være større end 0');
      }
    }

    return this.prisma.scenarioTask.create({
      data: {
        scenarioId,
        taskId: dto.taskId,

        activationMode,

        latitude: activationMode === ActivationMode.GEO ? dto.latitude : null,

        longitude: activationMode === ActivationMode.GEO ? dto.longitude : null,

        radiusMeters:
          activationMode === ActivationMode.GEO ? dto.radiusMeters : null,
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
  //UPDATE TASK ACTIVATION
  async updateTaskActivation(
    scenarioId: string,
    scenarioTaskId: string,
    dto: UpdateScenarioTaskActivationDto,
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

    if (dto.activationMode === ActivationMode.GEO) {
      if (
        dto.latitude === undefined ||
        dto.longitude === undefined ||
        dto.radiusMeters === undefined
      ) {
        throw new BadRequestException(
          'GEO-opgaver skal have latitude, longitude og radiusMeters',
        );
      }

      if (dto.radiusMeters <= 0) {
        throw new BadRequestException('radiusMeters skal være større end 0');
      }
    }

    return this.prisma.scenarioTask.update({
      where: {
        id: scenarioTaskId,
      },

      data: {
        activationMode: dto.activationMode,

        latitude:
          dto.activationMode === ActivationMode.GEO ? dto.latitude : null,

        longitude:
          dto.activationMode === ActivationMode.GEO ? dto.longitude : null,

        radiusMeters:
          dto.activationMode === ActivationMode.GEO ? dto.radiusMeters : null,
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
