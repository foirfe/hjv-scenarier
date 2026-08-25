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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/enums';
import { Roles } from '@/auth/decorators/roles.decorator';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}
  @ApiBearerAuth()
  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.tasksService.findAll();
  }
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }
  @ApiBearerAuth()
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }
  @ApiBearerAuth()
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }
  @ApiBearerAuth()
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.remove(id);
  }
}
