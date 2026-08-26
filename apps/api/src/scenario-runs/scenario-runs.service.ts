import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
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
        scenario: true,
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

    return this.prisma.scenarioRun.update({
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
        completedAt: true,

        scenario: {
          select: {
            id: true,
            name: true,
          },
        },

        users: {
          select: {
            role: true,

            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
    });
  }
}
