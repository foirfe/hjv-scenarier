import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';

import { TasksService } from './tasks.service';
import { TaskImportService } from './task-import.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '../../generated/prisma/enums';
import { Roles } from '@/auth/decorators/roles.decorator';

type UploadedExcelFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,

    private readonly taskImportService: TaskImportService,
  ) {}
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Hent alle opgaver',
    description:
      'Returnerer en liste over alle opgaver i systemet. Kræver ADMIN-rolle.',
  })
  @ApiResponse({ status: 200, description: 'Listen over opgaver blev hentet.' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({
    status: 403,
    description: 'Adgang nægtet (mangler ADMIN-rolle).',
  })
  findAll() {
    return this.tasksService.findAll();
  }
  @Get('form-options')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Hent valgmuligheder til opgaveformular',
  })
  getFormOptions() {
    return this.tasksService.getFormOptions();
  }
  @Get(':id')
  @ApiOperation({
    summary: 'Hent en specifik opgave',
    description: 'Henter detaljer for en enkelt opgave baseret på dens UUID.',
  })
  @ApiParam({ name: 'id', description: 'UUID på den ønskede opgave' })
  @ApiResponse({
    status: 200,
    description: 'Opgaven blev fundet og returneret.',
  })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({ status: 404, description: 'Opgaven blev ikke fundet.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Opret en ny opgave',
    description: 'Opretter en ny opgaveregistrering. Kræver ADMIN-rolle.',
  })
  @ApiResponse({ status: 201, description: 'Opgaven blev oprettet.' })
  @ApiResponse({ status: 400, description: 'Ugyldig input data.' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({
    status: 403,
    description: 'Adgang nægtet (mangler ADMIN-rolle).',
  })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Opdater en opgave',
    description:
      'Opdaterer stamdata for en eksisterende opgave. Kræver ADMIN-rolle.',
  })
  @ApiParam({ name: 'id', description: 'UUID på opgaven der skal opdateres' })
  @ApiResponse({ status: 200, description: 'Opgaven blev opdateret.' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({
    status: 403,
    description: 'Adgang nægtet (mangler ADMIN-rolle).',
  })
  @ApiResponse({ status: 404, description: 'Opgaven blev ikke fundet.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Slet en opgave',
    description: 'Fjerner en opgave fra systemet. Kræver ADMIN-rolle.',
  })
  @ApiParam({ name: 'id', description: 'UUID på opgaven der skal slettes' })
  @ApiResponse({ status: 200, description: 'Opgaven blev slettet.' })
  @ApiResponse({ status: 401, description: 'Ikke autoriseret.' })
  @ApiResponse({
    status: 403,
    description: 'Adgang nægtet (mangler ADMIN-rolle).',
  })
  @ApiResponse({ status: 404, description: 'Opgaven blev ikke fundet.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.remove(id);
  }
  @Get('import/template')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Download Excel-skabelon til opgaveimport',
  })
  async downloadImportTemplate(
    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const file = await this.taskImportService.createTemplate();

    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    response.setHeader(
      'Content-Disposition',
      'attachment; filename="HJV-opgave-import.xlsx"',
    );

    return new StreamableFile(file);
  }
  @Post('import/preview')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Validér Excel-fil før import af opgaver',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  previewImport(
    @UploadedFile()
    file?: UploadedExcelFile,
  ) {
    if (!file) {
      throw new BadRequestException('Der blev ikke uploadet en fil');
    }

    if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
      throw new BadRequestException('Kun .xlsx-filer understøttes');
    }

    return this.taskImportService.previewImport(file.buffer);
  }
}
