import { Module } from '@nestjs/common';

import { ScenarioRunsController } from './scenario-runs.controller';
import { ScenarioRunsService } from './scenario-runs.service';

@Module({
  controllers: [ScenarioRunsController],
  providers: [ScenarioRunsService],
})
export class ScenarioRunsModule {}
