import { Module } from '@nestjs/common';

import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskImportService } from './task-import.service';

@Module({
  controllers: [TasksController],

  providers: [TasksService, TaskImportService],
})
export class TasksModule {}
