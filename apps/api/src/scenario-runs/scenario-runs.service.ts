import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateScenarioRunDto } from './dto/create-scenario-run.dto';
import { AddScenarioRunUserDto } from './dto/add-scenario-run-user.dto';

@Injectable()
export class ScenarioRunsService {
  constructor(private readonly prisma: PrismaService) {}
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
}
