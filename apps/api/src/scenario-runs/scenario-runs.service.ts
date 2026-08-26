import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { TaskProgressStatus } from '../../generated/prisma/client';
import { CreateScenarioRunDto } from './dto/create-scenario-run.dto';
import { AddScenarioRunUserDto } from './dto/add-scenario-run-user.dto';
import { RemoveScenarioRunUserDto } from './dto/remove-scenario-run-user.dto';
import { UpdateScenarioRunUserDto } from './dto/update-scenario-run.user.dto';

@Injectable()
export class ScenarioRunsService {
  constructor(private readonly prisma: PrismaService) {}
  //CREATE SCENARIO RUN
  async create(dto: CreateScenarioRunDto) {
    const scenario = await this.prisma.scenario.findUnique({
      where: {
        id: dto.scenarioId,
      },
    });
    if (!scenario) {
      throw new NotFoundException('Scenariet blev ikke fundet');
    }
    return this.prisma.scenarioRun.create({
      data: {
        scenarioId: dto.scenarioId,
      },
      select: {
        id: true,
        scenarioId: true,
        status: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        scenario: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });
  }
  async addUser(runId: string, dto: AddScenarioRunUserDto) {
    const scenarioRun = await this.prisma.scenarioRun.findUnique({
      where: {
        id: runId,
      },
    });

    if (!scenarioRun) {
      throw new NotFoundException('Scenarieafviklingen blev ikke fundet');
    }

    if (
      scenarioRun.status === 'COMPLETED' ||
      scenarioRun.status === 'ABORTED'
    ) {
      throw new BadRequestException(
        'Der kan ikke tilføjes brugere til en afsluttet scenarieafvikling',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Brugeren blev ikke fundet');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException(
        'En inaktiv bruger kan ikke tilføjes til en scenarieafvikling',
      );
    }

    const existingRunUser = await this.prisma.scenarioRunUser.findUnique({
      where: {
        scenarioRunId_userId: {
          scenarioRunId: runId,
          userId: dto.userId,
        },
      },
    });

    if (existingRunUser) {
      throw new ConflictException(
        'Brugeren er allerede tilføjet til scenarieafviklingen',
      );
    }
    return this.prisma.scenarioRunUser.create({
      data: {
        scenarioRunId: runId,
        userId: dto.userId,
        role: dto.role,
      },
      select: {
        userId: true,
        role: true,
        createdAt: true,

        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }
  //FOR GET SCENARIORUN
  async findOne(runId: string) {
    const scenarioRun = await this.prisma.scenarioRun.findUnique({
      where: {
        id: runId,
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        scenario: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
          },
        },
        users: {
          select: {
            role: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                role: true,
                status: true,
              },
            },
          },
        },
      },
    });
    if (!scenarioRun) {
      throw new NotFoundException('Scenarieafviklingen blev ikke fundet');
    }
    return scenarioRun;
  }
  //Update UserRole In ScenarioRun
  async updateScenarioRunUser(
    scenarioRunId: string,
    userId: string,
    dto: UpdateScenarioRunUserDto,
  ) {
    const scenarioRunUser = await this.prisma.scenarioRunUser.findUnique({
      where: {
        scenarioRunId_userId: {
          scenarioRunId,
          userId,
        },
      },
    });
    if (!scenarioRunUser) {
      throw new NotFoundException(
        'Brugeren findes ikke på denne scenarioafvikling',
      );
    }
    return this.prisma.scenarioRunUser.update({
      where: {
        scenarioRunId_userId: {
          scenarioRunId,
          userId,
        },
      },
      data: {
        role: dto.role,
      },
    });
  }
  //Remove User From ScenarioRun
  async removeScenarioRunUser(
    scenarioRunId: string,
    dto: RemoveScenarioRunUserDto,
  ) {
    return this.prisma.scenarioRunUser.delete({
      where: {
        scenarioRunId_userId: {
          scenarioRunId,
          userId: dto.userId,
        },
      },
    });
  }
  //START SCENARIORUN
  async start(runId: string) {
    const scenarioRun = await this.prisma.scenarioRun.findUnique({
      where: {
        id: runId,
      },
      include: {
        users: true,
        scenario: {
          include: {
            scenarioTasks: {
              include: {
                task: {
                  include: {
                    taskType: true,
                    options: true,
                  },
                },
                dependencies: true,
              },
            },
          },
        },
      },
    });

    if (!scenarioRun) {
      throw new NotFoundException('Scenarieafviklingen blev ikke fundet');
    }

    if (scenarioRun.status !== 'NOT_STARTED') {
      throw new BadRequestException(
        'Kun en scenarieafvikling der ikke er startet kan startes',
      );
    }

    if (scenarioRun.users.length === 0) {
      throw new BadRequestException(
        'Scenarieafviklingen skal have mindst én bruger',
      );
    }

    if (scenarioRun.scenario.status !== 'READY') {
      throw new BadRequestException(
        'Scenariet skal være READY før afviklingen kan startes',
      );
    }
    //SNAPSHOTS MÅ IKKE FEJLE, VI VIL HAVE ALT ELLER INTET
    return this.prisma.$transaction(async (tx) => {
      const taskIdMap = new Map<string, string>();

      for (const scenarioTask of scenarioRun.scenario.scenarioTasks) {
        const runTask = await tx.scenarioRunTask.create({
          data: {
            scenarioRunId: runId,

            sourceScenarioTaskId: scenarioTask.id,
            sourceTaskId: scenarioTask.task.id,

            name: scenarioTask.task.name,
            description: scenarioTask.task.description,
            instructions: scenarioTask.task.instructions,
            answerType: scenarioTask.task.answerType,
            taskTypeCode: scenarioTask.task.taskType.code,

            latitude: scenarioTask.latitude,
            longitude: scenarioTask.longitude,
            radiusMeters: scenarioTask.radiusMeters,

            options: {
              create: scenarioTask.task.options.map((option) => ({
                optionText: option.optionText,
                isCorrect: option.isCorrect,
                sortOrder: option.sortOrder,
              })),
            },
          },
        });

        taskIdMap.set(scenarioTask.id, runTask.id);
      }

      for (const scenarioTask of scenarioRun.scenario.scenarioTasks) {
        const runTaskId = taskIdMap.get(scenarioTask.id);

        if (!runTaskId) {
          throw new Error('Kunne ikke finde snapshot af scenario task');
        }

        for (const dependency of scenarioTask.dependencies) {
          const prerequisiteRunTaskId = taskIdMap.get(
            dependency.prerequisiteTaskId,
          );

          if (!prerequisiteRunTaskId) {
            throw new Error('Kunne ikke finde snapshot af prerequisite task');
          }

          await tx.scenarioRunTaskDependency.create({
            data: {
              scenarioRunTaskId: runTaskId,
              prerequisiteRunTaskId,
            },
          });
        }
      }
      //UPDATE PROGRESS PÅ BRUGERE I SCENARIORUN
      const startedAt = new Date();

      const progressRows: {
        scenarioRunTaskId: string;
        userId: string;
        status: TaskProgressStatus;
        availableAt: Date | null;
      }[] = [];

      for (const runUser of scenarioRun.users) {
        if (runUser.role === 'INSTRUCTOR') {
          continue;
        }

        for (const scenarioTask of scenarioRun.scenario.scenarioTasks) {
          const scenarioRunTaskId = taskIdMap.get(scenarioTask.id);

          if (!scenarioRunTaskId) {
            throw new Error('Kunne ikke finde snapshot af scenario task');
          }

          const hasDependencies = scenarioTask.dependencies.length > 0;

          progressRows.push({
            scenarioRunTaskId,
            userId: runUser.userId,

            status: hasDependencies
              ? TaskProgressStatus.LOCKED
              : TaskProgressStatus.AVAILABLE,

            availableAt: hasDependencies ? null : startedAt,
          });
        }
      }
      await tx.scenarioRunTaskProgress.createMany({
        data: progressRows,
      });
      return tx.scenarioRun.update({
        where: {
          id: runId,
        },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          startedAt: true,
        },
      });
    });
  }
  //COMPLETE TASKS OG VALIDERING DERTIL
  async completeTask(runId: string, runTaskId: string, userId: string) {
    const scenarioRun = await this.prisma.scenarioRun.findUnique({
      where: {
        id: runId,
      },
    });

    if (!scenarioRun) {
      throw new NotFoundException('Scenarieafviklingen blev ikke fundet');
    }

    if (scenarioRun.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Scenarieafviklingen er ikke i gang');
    }

    const progress = await this.prisma.scenarioRunTaskProgress.findUnique({
      where: {
        scenarioRunTaskId_userId: {
          scenarioRunTaskId: runTaskId,
          userId,
        },
      },

      include: {
        scenarioRunTask: true,
      },
    });

    if (!progress) {
      throw new NotFoundException('Opgaven blev ikke fundet for denne bruger');
    }

    if (progress.scenarioRunTask.scenarioRunId !== runId) {
      throw new BadRequestException(
        'Opgaven tilhører ikke denne scenarieafvikling',
      );
    }

    if (progress.status !== TaskProgressStatus.ACTIVE) {
      throw new BadRequestException('Kun en aktiv opgave kan færdiggøres');
    }

    const completedAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      const completedProgress = await tx.scenarioRunTaskProgress.update({
        where: {
          scenarioRunTaskId_userId: {
            scenarioRunTaskId: runTaskId,
            userId,
          },
        },

        data: {
          status: TaskProgressStatus.COMPLETED,
          completedAt,
        },
      });

      const dependentTasks = await tx.scenarioRunTaskDependency.findMany({
        where: {
          prerequisiteRunTaskId: runTaskId,
        },

        select: {
          scenarioRunTaskId: true,
        },
      });

      for (const dependent of dependentTasks) {
        const prerequisites = await tx.scenarioRunTaskDependency.findMany({
          where: {
            scenarioRunTaskId: dependent.scenarioRunTaskId,
          },

          select: {
            prerequisiteRunTaskId: true,
          },
        });

        const completedPrerequisites = await tx.scenarioRunTaskProgress.count({
          where: {
            userId,

            scenarioRunTaskId: {
              in: prerequisites.map(
                (dependency) => dependency.prerequisiteRunTaskId,
              ),
            },

            status: TaskProgressStatus.COMPLETED,
          },
        });

        if (completedPrerequisites !== prerequisites.length) {
          continue;
        }

        await tx.scenarioRunTaskProgress.updateMany({
          where: {
            scenarioRunTaskId: dependent.scenarioRunTaskId,
            userId,
            status: TaskProgressStatus.LOCKED,
          },

          data: {
            status: TaskProgressStatus.AVAILABLE,
            availableAt: completedAt,
          },
        });
      }

      return completedProgress;
    });
  }
}
