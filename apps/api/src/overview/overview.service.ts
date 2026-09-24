import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import {
  ScenarioRunStatus,
  ScenarioStatus,
  TaskStatus,
  UserStatus,
} from '../../generated/prisma/enums';

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      activeRunsCount,
      scenariosCount,
      activeTasksCount,
      activeUsersCount,
      activeRuns,
      attentionScenarios,
    ] = await Promise.all([
      this.prisma.scenarioRun.count({
        where: {
          status: ScenarioRunStatus.IN_PROGRESS,
        },
      }),

      this.prisma.scenario.count({
        where: {
          status: {
            not: ScenarioStatus.ARCHIVED,
          },
        },
      }),

      this.prisma.task.count({
        where: {
          status: TaskStatus.ACTIVE,
        },
      }),

      this.prisma.user.count({
        where: {
          status: UserStatus.ACTIVE,
        },
      }),

      this.prisma.scenarioRun.findMany({
        where: {
          status: ScenarioRunStatus.IN_PROGRESS,
        },

        orderBy: {
          startedAt: 'desc',
        },

        take: 5,

        select: {
          id: true,
          name: true,
          status: true,
          startedAt: true,

          scenario: {
            select: {
              id: true,
              name: true,
            },
          },

          _count: {
            select: {
              users: true,
              tasks: true,
            },
          },
        },
      }),

      this.prisma.scenario.findMany({
        where: {
          OR: [
            {
              status: ScenarioStatus.DRAFT,
            },
            {
              scenarioTasks: {
                none: {},
              },
            },
          ],
        },

        orderBy: {
          updatedAt: 'desc',
        },

        take: 5,

        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,

          _count: {
            select: {
              scenarioTasks: true,
            },
          },
        },
      }),
    ]);

    return {
      counts: {
        activeRuns: activeRunsCount,

        scenarios: scenariosCount,

        activeTasks: activeTasksCount,

        activeUsers: activeUsersCount,
      },

      activeRuns,

      attentionScenarios,
    };
  }
}
