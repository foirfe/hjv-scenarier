import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.task.findMany({
      include: {
        taskType: true,
        environment: true,
        options: true,
        _count: {
          select: {
            scenarioTasks: true,
          },
        },
      },
    });
  }
  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        environment: true,
        taskType: true,
        options: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        _count: {
          select: {
            scenarioTasks: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Opgaven blev ikke fundet');
    }

    return task;
  }
  create(dto: CreateTaskDto) {
    const { options, ...taskData } = dto;

    return this.prisma.task.create({
      data: {
        ...taskData,

        ...(options?.length
          ? {
              options: {
                create: options,
              },
            }
          : {}),
      },

      include: {
        environment: true,
        taskType: true,
        options: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });
  }
  update(id: string, dto: UpdateTaskDto) {
    const { options, ...taskData } = dto;

    return this.prisma.task.update({
      where: { id },

      data: {
        ...taskData,

        ...(options !== undefined
          ? {
              options: {
                deleteMany: {},
                create: options,
              },
            }
          : {}),
      },

      include: {
        environment: true,
        taskType: true,
        options: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });
  }
  remove(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }
  async getFormOptions() {
    const [environments, taskTypes] = await Promise.all([
      this.prisma.environment.findMany({
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.taskType.findMany({
        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    return {
      environments,
      taskTypes,
    };
  }
}
