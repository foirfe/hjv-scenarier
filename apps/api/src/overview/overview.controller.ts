import { Controller, Get } from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserRole } from '../../generated/prisma/enums';

import { Roles } from '../auth/decorators/roles.decorator';

import { OverviewService } from './overview.service';

@ApiTags('overview')
@ApiBearerAuth()
@Controller('overview')
@Roles(UserRole.ADMIN)
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get()
  @ApiOperation({
    summary: 'Hent data til management-oversigt',
  })
  getOverview() {
    return this.overviewService.getOverview();
  }
}
