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
      },
    });
  }
  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Opgaven blev ikke fundet');
    }

    return task;
  }
  create(createTaskDto: CreateTaskDto) {
    return this.prisma.task.create({
      data: createTaskDto,
    });
  }
  update(id: string, dto: UpdateTaskDto) {
    return this.prisma.task.update({
      where: { id },
      data: dto,
    });
  }
  remove(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }
}
