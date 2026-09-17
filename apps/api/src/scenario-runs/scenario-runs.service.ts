import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import {
  ActivationMode,
  TaskProgressStatus,
  UserRole,
  ScenarioRole,
} from '../../generated/prisma/client';
import { CreateScenarioRunDto } from './dto/create-scenario-run.dto';
import { UpdateScenarioRunDto } from './dto/update-scenario-run.dto';
import { AddScenarioRunUserDto } from './dto/add-scenario-run-user.dto';
import { RemoveScenarioRunUserDto } from './dto/remove-scenario-run-user.dto';
import { UpdateScenarioRunUserDto } from './dto/update-scenario-run.user.dto';
import { ActivateScenarioRunTaskDto } from './dto/activate-scenario-run-task.dto';
import { SubmitTaskAnswerDto } from './dto/submit-task-answer.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';

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
        name: dto.name?.trim() || null,
      },
      select: {
        id: true,
        name: true,
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
  async update(runId: string, dto: UpdateScenarioRunDto) {
    const run = await this.prisma.scenarioRun.findUnique({
      where: {
        id: runId,
      },
    });

    if (!run) {
      throw new NotFoundException('Scenarieafviklingen blev ikke fundet');
    }

    return this.prisma.scenarioRun.update({
      where: {
        id: runId,
      },

      data: {
        name: dto.name?.trim() || null,
      },

      select: {
        id: true,
        name: true,
        status: true,
        scenarioId: true,
        startedAt: true,
        completedAt: true,
        updatedAt: true,
      },
    });
  }
  async addUser(runId: string, dto: AddScenarioRunUserDto) {
    await this.ensureRunIsEditable(runId);
    const scenarioRun = await this.prisma.scenarioRun.findUnique({
      where: {
        id: runId,
      },
    });

    if (!scenarioRun) {
      throw new NotFoundException('Scenarieafviklingen blev ikke fundet');
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
        name: true,
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
        tasks: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            name: true,
            activationMode: true,

            progress: {
              select: {
                userId: true,
                status: true,
                availableAt: true,
                startedAt: true,
                completedAt: true,
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
  //TIL ADMIN DELEN SE ALLE SCENARIE RUNS
  findAll() {
    return this.prisma.scenarioRun.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,

        scenario: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },

        _count: {
          select: {
            users: true,
            tasks: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  //Update UserRole In ScenarioRun
  async updateScenarioRunUser(
    scenarioRunId: string,
    userId: string,
    dto: UpdateScenarioRunUserDto,
  ) {
    await this.ensureRunIsEditable(scenarioRunId);
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
    await this.ensureRunIsEditable(scenarioRunId);
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

                    options: {
                      orderBy: {
                        sortOrder: 'asc',
                      },
                    },

                    checklistItems: {
                      orderBy: {
                        sortOrder: 'asc',
                      },
                    },
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
    const hasParticipant = scenarioRun.users.some(
      (user) =>
        user.role === ScenarioRole.PARTICIPANT ||
        user.role === ScenarioRole.TEAM_LEADER,
    );

    if (!hasParticipant) {
      throw new BadRequestException(
        'Scenarieafviklingen skal have mindst én deltager eller holdleder',
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
            instructorInstructions: scenarioTask.task.instructorInstructions,
            answerType: scenarioTask.task.answerType,
            taskTypeCode: scenarioTask.task.taskType.code,

            activationMode: scenarioTask.activationMode,

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
            checklistItems: {
              create: scenarioTask.task.checklistItems.map((item) => ({
                sourceChecklistItemId: item.id,
                itemText: item.itemText,
                sortOrder: item.sortOrder,
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
        startedAt: Date | null;
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

          let status: TaskProgressStatus;
          let availableAt: Date | null = null;
          let taskStartedAt: Date | null = null;

          if (hasDependencies) {
            status = TaskProgressStatus.LOCKED;
          } else if (scenarioTask.activationMode === ActivationMode.AUTOMATIC) {
            status = TaskProgressStatus.ACTIVE;
            availableAt = startedAt;
            taskStartedAt = startedAt;
          } else {
            status = TaskProgressStatus.AVAILABLE;
            availableAt = startedAt;
          }

          progressRows.push({
            scenarioRunTaskId,
            userId: runUser.userId,
            status,
            availableAt,
            startedAt: taskStartedAt,
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
        scenarioRunTask: {
          include: {
            checklistItems: {
              select: {
                id: true,
              },
            },
          },
        },
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
    //SIKRER AT ALLE CHECKS ER MARKERET FØR MAN KAN FÆRDDIGGØRE OPGAVEN
    if (progress.scenarioRunTask.taskTypeCode === 'CHECKLIST') {
      const checklistItems = progress.scenarioRunTask.checklistItems;

      if (checklistItems.length === 0) {
        throw new BadRequestException('Tjeklisten indeholder ingen punkter');
      }

      const checkedIds = Array.isArray(progress.checkedChecklistItemIds)
        ? progress.checkedChecklistItemIds.filter(
            (id): id is string => typeof id === 'string',
          )
        : [];

      const allChecked = checklistItems.every((item) =>
        checkedIds.includes(item.id),
      );

      if (!allChecked) {
        throw new BadRequestException(
          'Alle punkter på tjeklisten skal være gennemført',
        );
      }
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

          scenarioRunTask: {
            select: {
              activationMode: true,
              manualActivatedAt: true,
            },
          },
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
        const { activationMode, manualActivatedAt } = dependent.scenarioRunTask;

        if (
          activationMode === ActivationMode.AUTOMATIC ||
          (activationMode === ActivationMode.MANUAL &&
            manualActivatedAt !== null)
        ) {
          await tx.scenarioRunTaskProgress.updateMany({
            where: {
              scenarioRunTaskId: dependent.scenarioRunTaskId,
              userId,
              status: TaskProgressStatus.LOCKED,
            },

            data: {
              status: TaskProgressStatus.ACTIVE,
              availableAt: completedAt,
              startedAt: completedAt,
            },
          });
        } else {
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
      }
      return completedProgress;
    });
  }
  async activateTask(
    runId: string,
    runTaskId: string,
    userId: string,
    dto: ActivateScenarioRunTaskDto,
  ) {
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
    if (progress.scenarioRunTask.activationMode !== ActivationMode.GEO) {
      throw new BadRequestException('Opgaven bruger ikke GPS-aktivering');
    }
    if (progress.status === TaskProgressStatus.ACTIVE) {
      return progress;
    }

    if (progress.status !== TaskProgressStatus.AVAILABLE) {
      throw new BadRequestException('Opgaven er ikke tilgængelig endnu');
    }
    const task = progress.scenarioRunTask;

    if (
      task.latitude === null ||
      task.longitude === null ||
      task.radiusMeters === null
    ) {
      throw new BadRequestException('GPS-opgaven mangler lokationsdata');
    }

    const taskLatitude = Number(task.latitude);
    const taskLongitude = Number(task.longitude);
    const radiusMeters = task.radiusMeters;

    const distanceMeters = getDistanceMeters(
      dto.latitude,
      dto.longitude,
      taskLatitude,
      taskLongitude,
    );

    if (distanceMeters > radiusMeters) {
      throw new BadRequestException(
        `Du er ${Math.round(distanceMeters)} meter fra opgaven`,
      );
    }

    const startedAt = new Date();

    const updatedProgress = await this.prisma.scenarioRunTaskProgress.update({
      where: {
        scenarioRunTaskId_userId: {
          scenarioRunTaskId: runTaskId,
          userId,
        },
      },

      data: {
        status: TaskProgressStatus.ACTIVE,
        startedAt,
      },
    });

    return {
      ...updatedProgress,
      distanceMeters: Math.round(distanceMeters),
      accuracyMeters: dto.accuracyMeters,
    };
  }
  //AKTIVERING AF TASK MANUELT
  async activateTaskManually(
    runId: string,
    runTaskId: string,
    userId: string,
    targetUserId: string,
  ) {
    const runUser = await this.prisma.scenarioRunUser.findUnique({
      where: {
        scenarioRunId_userId: {
          scenarioRunId: runId,
          userId,
        },
      },

      include: {
        user: true,
      },
    });
    const canActivate =
      runUser?.role === ScenarioRole.INSTRUCTOR ||
      runUser?.user.role === UserRole.ADMIN;

    if (!canActivate) {
      throw new ForbiddenException(
        'Du har ikke adgang til at aktivere opgaven',
      );
    }
    if (!runUser) {
      throw new ForbiddenException(
        'Du er ikke tilknyttet denne scenarieafvikling',
      );
    }

    const runTask = await this.prisma.scenarioRunTask.findFirst({
      where: {
        id: runTaskId,
        scenarioRunId: runId,
      },
      include: {
        scenarioRun: true,
      },
    });

    if (!runTask) {
      throw new NotFoundException('Opgaven blev ikke fundet');
    }
    if (runTask.scenarioRun.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Scenarieafviklingen er ikke i gang');
    }
    if (runTask.activationMode !== ActivationMode.MANUAL) {
      throw new BadRequestException('Opgaven bruger ikke manuel aktivering');
    }
    const startedAt = new Date();

    await this.prisma.scenarioRunTask.update({
      where: {
        id: runTaskId,
      },
      data: {
        manualActivatedAt: startedAt,
      },
    });

    const progress = await this.prisma.scenarioRunTaskProgress.findUnique({
      where: {
        scenarioRunTaskId_userId: {
          scenarioRunTaskId: runTaskId,

          userId: targetUserId,
        },
      },
    });

    if (!progress) {
      throw new NotFoundException('Deltagerens opgave blev ikke fundet');
    }

    if (progress.status !== TaskProgressStatus.AVAILABLE) {
      throw new BadRequestException(
        'Opgaven er ikke klar til aktivering for denne deltager',
      );
    }

    return this.prisma.scenarioRunTaskProgress.update({
      where: {
        scenarioRunTaskId_userId: {
          scenarioRunTaskId: runTaskId,

          userId: targetUserId,
        },
      },

      data: {
        status: TaskProgressStatus.ACTIVE,

        startedAt,
      },
    });
  }
  //FINDER BRUGERS RUNS
  findMyRuns(userId: string) {
    return this.prisma.scenarioRunUser.findMany({
      where: {
        userId,
      },

      select: {
        role: true,

        scenarioRun: {
          select: {
            id: true,
            name: true,
            status: true,
            startedAt: true,
            completedAt: true,

            scenario: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  //FUNKTION TIL AT FINDE BRUGER MED ROLLE
  async findMe(runId: string, userId: string) {
    const runUser = await this.prisma.scenarioRunUser.findUnique({
      where: {
        scenarioRunId_userId: {
          scenarioRunId: runId,
          userId,
        },
      },
      select: {
        role: true,
        scenarioRun: {
          select: {
            id: true,
            name: true,
            status: true,
            startedAt: true,
            completedAt: true,
            scenario: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            tasks: {
              orderBy: {
                createdAt: 'asc',
              },

              select: {
                id: true,
                name: true,
                description: true,
                instructions: true,
                instructorInstructions: true,
                answerType: true,
                taskTypeCode: true,
                activationMode: true,

                latitude: true,
                longitude: true,
                radiusMeters: true,

                options: {
                  orderBy: {
                    sortOrder: 'asc',
                  },
                  select: {
                    id: true,
                    optionText: true,
                    sortOrder: true,
                  },
                },
                checklistItems: {
                  orderBy: {
                    sortOrder: 'asc',
                  },

                  select: {
                    id: true,
                    itemText: true,
                    sortOrder: true,
                  },
                },
                dependencies: {
                  select: {
                    prerequisiteRunTaskId: true,
                  },
                },

                progress: {
                  select: {
                    userId: true,
                    status: true,
                    availableAt: true,
                    startedAt: true,
                    completedAt: true,
                    checkedChecklistItemIds: true,

                    user: {
                      select: {
                        id: true,
                        displayName: true,
                        username: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!runUser) {
      throw new ForbiddenException(
        'Du er ikke tilknyttet denne scenarieafvikling',
      );
    }
    const run = runUser.scenarioRun;

    if (runUser.role === ScenarioRole.INSTRUCTOR) {
      return {
        id: run.id,
        name: run.name,
        status: run.status,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        role: runUser.role,
        scenario: run.scenario,

        tasks: run.tasks.map((task) => ({
          id: task.id,

          name: task.name,
          description: task.description,

          instructions: task.instructions,

          instructorInstructions: task.instructorInstructions,

          answerType: task.answerType,
          taskTypeCode: task.taskTypeCode,

          activationMode: task.activationMode,

          participants: task.progress.map((progress) => ({
            userId: progress.userId,

            displayName: progress.user.displayName,

            username: progress.user.username,

            status: progress.status,

            availableAt: progress.availableAt,

            startedAt: progress.startedAt,

            completedAt: progress.completedAt,
          })),
        })),
      };
    }

    return {
      id: run.id,
      name: run.name,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      role: runUser.role,
      scenario: run.scenario,
      tasks: run.tasks.map((task) => {
        const progress =
          task.progress.find((item) => item.userId === userId) ?? null;
        const status = progress?.status ?? null;
        const isUnlocked =
          status !== TaskProgressStatus.LOCKED && status !== null;

        const canSeeContent =
          status === TaskProgressStatus.ACTIVE ||
          status === TaskProgressStatus.COMPLETED;

        const checkedChecklistItemIds = Array.isArray(
          progress?.checkedChecklistItemIds,
        )
          ? progress.checkedChecklistItemIds.filter(
              (id): id is string => typeof id === 'string',
            )
          : [];

        const canSeeLocation =
          status === TaskProgressStatus.AVAILABLE &&
          task.activationMode === ActivationMode.GEO;
        return {
          id: task.id,

          name: isUnlocked ? task.name : 'Låst opgave',

          activationMode: isUnlocked ? task.activationMode : null,

          status,

          availableAt: progress?.availableAt ?? null,

          startedAt: progress?.startedAt ?? null,

          completedAt: progress?.completedAt ?? null,

          description: canSeeContent ? task.description : null,

          instructions: canSeeContent ? task.instructions : null,

          answerType: canSeeContent ? task.answerType : null,

          taskTypeCode: canSeeContent ? task.taskTypeCode : null,

          options: canSeeContent ? task.options : [],

          latitude: canSeeLocation ? task.latitude : null,

          longitude: canSeeLocation ? task.longitude : null,

          radiusMeters: canSeeLocation ? task.radiusMeters : null,

          checklistItems:
            canSeeContent && task.taskTypeCode === 'CHECKLIST'
              ? task.checklistItems
              : [],

          checkedChecklistItemIds:
            canSeeContent && task.taskTypeCode === 'CHECKLIST'
              ? checkedChecklistItemIds
              : [],
        };
      }),
    };
  }
  //FUNKTION TIL SUBMIT AF SVAR
  async submitAnswer(
    runId: string,
    runTaskId: string,
    userId: string,
    dto: SubmitTaskAnswerDto,
  ) {
    const progress = await this.prisma.scenarioRunTaskProgress.findUnique({
      where: {
        scenarioRunTaskId_userId: {
          scenarioRunTaskId: runTaskId,
          userId,
        },
      },

      include: {
        scenarioRunTask: {
          include: {
            options: true,
            scenarioRun: true,
          },
        },
      },
    });

    if (!progress) {
      throw new NotFoundException('Opgaven blev ikke fundet for denne bruger');
    }

    const task = progress.scenarioRunTask;

    if (task.scenarioRunId !== runId) {
      throw new BadRequestException(
        'Opgaven tilhører ikke denne scenarieafvikling',
      );
    }

    if (task.scenarioRun.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Scenarieafviklingen er ikke i gang');
    }

    if (progress.status !== TaskProgressStatus.ACTIVE) {
      throw new BadRequestException('Kun en aktiv opgave kan besvares');
    }

    if (!task.answerType) {
      throw new BadRequestException('Denne opgave kræver ikke et svar');
    }

    const answeredAt = new Date();

    if (task.answerType === 'MULTIPLE_CHOICE' || task.answerType === 'YES_NO') {
      const selectedOptionIds = dto.selectedOptionIds ?? [];

      if (selectedOptionIds.length === 0) {
        throw new BadRequestException('Vælg mindst ét svar');
      }

      const validOptionIds = new Set(task.options.map((option) => option.id));

      const containsInvalidOption = selectedOptionIds.some(
        (id) => !validOptionIds.has(id),
      );

      if (containsInvalidOption) {
        throw new BadRequestException(
          'Et eller flere svar tilhører ikke opgaven',
        );
      }

      const correctOptionIds = task.options
        .filter((option) => option.isCorrect)
        .map((option) => option.id);
      const isCorrect = sameIds(selectedOptionIds, correctOptionIds);
      await this.prisma.scenarioRunTaskProgress.update({
        where: {
          scenarioRunTaskId_userId: {
            scenarioRunTaskId: runTaskId,
            userId,
          },
        },

        data: {
          selectedOptionIds,
          answerText: null,
          answerCorrect: isCorrect,
          answeredAt,
        },
      });

      if (!isCorrect) {
        return {
          correct: false,
          completed: false,
        };
      }

      await this.completeTask(runId, runTaskId, userId);

      return {
        correct: true,
        completed: true,
      };
    }

    const answerText = dto.textAnswer?.trim();

    if (!answerText) {
      throw new BadRequestException('Indtast et svar');
    }

    if (!answerText) {
      throw new BadRequestException('Indtast et svar');
    }

    await this.prisma.scenarioRunTaskProgress.update({
      where: {
        scenarioRunTaskId_userId: {
          scenarioRunTaskId: runTaskId,
          userId,
        },
      },

      data: {
        answerText,
        selectedOptionIds: undefined,
        answerCorrect: null,
        answeredAt,
      },
    });

    await this.completeTask(runId, runTaskId, userId);

    return {
      correct: null,
      completed: true,
    };
  }
  //HJÆLPER FUNKTION SOM SIKKER AT MAN IKKE KAN MANIPULERE BRUGERE PÅ EN STARTED/INPROGRESS ELLER AFSLUTTET SCENARIE
  private async ensureRunIsEditable(runId: string) {
    const scenarioRun = await this.prisma.scenarioRun.findUnique({
      where: {
        id: runId,
      },
      select: {
        status: true,
      },
    });

    if (!scenarioRun) {
      throw new NotFoundException('Scenarieafviklingen blev ikke fundet');
    }
    if (scenarioRun.status !== 'NOT_STARTED') {
      throw new BadRequestException(
        'Deltagere og roller kan kun ændres før scenarieafviklingen er startet',
      );
    }
  }
  //OPDATERE CHECKLISTE
  async updateChecklistItem(
    runId: string,
    runTaskId: string,
    itemId: string,
    userId: string,
    dto: UpdateChecklistItemDto,
  ) {
    const progress = await this.prisma.scenarioRunTaskProgress.findUnique({
      where: {
        scenarioRunTaskId_userId: {
          scenarioRunTaskId: runTaskId,
          userId,
        },
      },

      include: {
        scenarioRunTask: {
          include: {
            checklistItems: true,

            scenarioRun: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });

    if (!progress) {
      throw new NotFoundException('Opgaven blev ikke fundet for denne bruger');
    }

    const task = progress.scenarioRunTask;

    if (task.scenarioRunId !== runId) {
      throw new BadRequestException(
        'Opgaven tilhører ikke denne scenarieafvikling',
      );
    }

    if (task.scenarioRun.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Scenarieafviklingen er ikke i gang');
    }

    if (progress.status !== TaskProgressStatus.ACTIVE) {
      throw new BadRequestException('Kun en aktiv tjekliste kan ændres');
    }

    if (task.taskTypeCode !== 'CHECKLIST') {
      throw new BadRequestException('Opgaven er ikke en tjekliste');
    }

    const checklistItem = task.checklistItems.find(
      (item) => item.id === itemId,
    );

    if (!checklistItem) {
      throw new NotFoundException('Tjeklistepunktet blev ikke fundet');
    }

    const currentIds = Array.isArray(progress.checkedChecklistItemIds)
      ? progress.checkedChecklistItemIds.filter(
          (id): id is string => typeof id === 'string',
        )
      : [];

    const updatedIds = dto.checked
      ? Array.from(new Set([...currentIds, itemId]))
      : currentIds.filter((id) => id !== itemId);

    await this.prisma.scenarioRunTaskProgress.update({
      where: {
        scenarioRunTaskId_userId: {
          scenarioRunTaskId: runTaskId,
          userId,
        },
      },

      data: {
        checkedChecklistItemIds: updatedIds,
      },
    });

    const allChecked =
      task.checklistItems.length > 0 &&
      task.checklistItems.every((item) => updatedIds.includes(item.id));

    return {
      checkedChecklistItemIds: updatedIds,

      allChecked,
    };
  }
}
//Hjælpefunktion som gør brug af Haversine-formlen
function getDistanceMeters(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  const lat1 = toRadians(latitude1);
  const lat2 = toRadians(latitude2);
  const deltaLatitude = toRadians(latitude2 - latitude1);
  const deltaLongitude = toRadians(longitude2 - longitude1);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLongitude / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}
//HJÆLPERFUNKTION TIL AT FINDE "RIGTIGE SVAR"
function sameIds(first: string[], second: string[]) {
  if (first.length !== second.length) {
    return false;
  }
  const firstSet = new Set(first);
  return second.every((id) => firstSet.has(id));
}
