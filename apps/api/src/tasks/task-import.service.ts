import { BadRequestException, Injectable } from '@nestjs/common';
import { Workbook, type Worksheet } from 'exceljs';

import { PrismaService } from '../prisma/prisma.service';
import { AnswerType, TaskStatus } from '../../generated/prisma/client';

type ImportOption = {
  optionText: string;
  isCorrect: boolean;
  sortOrder: number;
};

type ImportChecklistItem = {
  itemText: string;
  sortOrder: number;
};

type ImportPreviewRow = {
  rowNumber: number;
  valid: boolean;
  errors: string[];

  duplicate: boolean;

  existingTask: {
    id: string;
    name: string;
  } | null;
  data: {
    name: string;
    description: string | null;
    instructions: string;
    instructorInstructions: string | null;

    environmentId: number | null;
    environmentName: string;

    taskTypeId: number | null;
    taskTypeCode: string | null;
    taskTypeName: string;

    status: TaskStatus | null;
    answerType: AnswerType | null;

    options: ImportOption[];
    checklistItems: ImportChecklistItem[];
  };
};

@Injectable()
export class TaskImportService {
  constructor(private readonly prisma: PrismaService) {}
  //LAVER TEMPLATE EXCEL FIL UD FRA DATA
  async createTemplate(): Promise<Buffer> {
    const [environments, taskTypes] = await Promise.all([
      this.prisma.environment.findMany(),

      this.prisma.taskType.findMany(),

      this.prisma.task.findMany({
        select: {
          id: true,
          name: true,
          environmentId: true,
          taskTypeId: true,
        },
      }),
    ]);

    const workbook = new Workbook();

    workbook.creator = 'HJV Scenarier';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Opgaver');

    const guide = workbook.addWorksheet('Vejledning');

    worksheet.columns = [
      {
        header: 'Navn *',
        key: 'name',
        width: 30,
      },
      {
        header: 'Beskrivelse',
        key: 'description',
        width: 35,
      },
      {
        header: 'Instruktioner *',
        key: 'instructions',
        width: 40,
      },
      {
        header: 'Instruktørinstruktion',
        key: 'instructorInstructions',
        width: 40,
      },
      {
        header: 'Miljø *',
        key: 'environment',
        width: 18,
      },
      {
        header: 'Opgavetype *',
        key: 'taskType',
        width: 22,
      },
      {
        header: 'Status *',
        key: 'status',
        width: 16,
      },
      {
        header: 'Svartype',
        key: 'answerType',
        width: 22,
      },
      {
        header: 'Svarmuligheder',
        key: 'options',
        width: 40,
      },
      {
        header: 'Korrekte svar',
        key: 'correctAnswers',
        width: 24,
      },
      {
        header: 'Tjeklistepunkter',
        key: 'checklistItems',
        width: 45,
      },
    ];

    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 1,
      },
    ];

    const headerRow = worksheet.getRow(1);

    headerRow.height = 28;

    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: {
          argb: 'FFFFFFFF',
        },
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: 'FF21483E',
        },
      };

      cell.alignment = {
        vertical: 'middle',
        wrapText: true,
      };
    });

    // Hidden lookup columns
    worksheet.getCell('M1').value = 'Miljøer';

    worksheet.getCell('N1').value = 'Opgavetyper';

    environments.forEach((environment, index) => {
      worksheet.getCell(`M${index + 2}`).value = environment.name;
    });

    taskTypes.forEach((taskType, index) => {
      worksheet.getCell(`N${index + 2}`).value = taskType.name;
    });

    worksheet.getColumn('M').hidden = true;

    worksheet.getColumn('N').hidden = true;

    const environmentEndRow = Math.max(2, environments.length + 1);

    const taskTypeEndRow = Math.max(2, taskTypes.length + 1);

    for (let row = 2; row <= 201; row++) {
      worksheet.getCell(`E${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`$M$2:$M$${environmentEndRow}`],
      };

      worksheet.getCell(`F${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`$N$2:$N$${taskTypeEndRow}`],
      };

      worksheet.getCell(`G${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"ACTIVE,DRAFT,ARCHIVED"'],
      };

      worksheet.getCell(`H${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"MULTIPLE_CHOICE,FREE_TEXT,YES_NO"'],
      };

      for (let column = 1; column <= 11; column++) {
        worksheet.getCell(row, column).alignment = {
          vertical: 'top',
          wrapText: true,
        };
      }
    }

    this.createGuideSheet(guide);

    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer);
  }

  async previewImport(buffer: Buffer) {
    const workbook = new Workbook();

    try {
      const arrayBuffer = Uint8Array.from(buffer).buffer;

      await workbook.xlsx.load(arrayBuffer);
    } catch {
      throw new BadRequestException('Excel-filen kunne ikke læses');
    }

    const worksheet = workbook.getWorksheet('Opgaver');

    if (!worksheet) {
      throw new BadRequestException('Excel-filen mangler arket "Opgaver"');
    }

    const [environments, taskTypes, existingTasks] = await Promise.all([
      this.prisma.environment.findMany(),

      this.prisma.taskType.findMany(),

      this.prisma.task.findMany({
        select: {
          id: true,
          name: true,
          environmentId: true,
          taskTypeId: true,
        },
      }),
    ]);

    const rows: ImportPreviewRow[] = [];

    worksheet.eachRow(
      {
        includeEmpty: false,
      },
      (row, rowNumber) => {
        if (rowNumber === 1) {
          return;
        }

        const values = Array.from({ length: 11 }, (_, index) =>
          row.getCell(index + 1).text.trim(),
        );

        const hasContent = values.some((value) => value !== '');

        if (!hasContent) {
          return;
        }

        rows.push(
          this.parseRow(
            rowNumber,
            values,
            environments,
            taskTypes,
            existingTasks,
          ),
        );
      },
    );

    if (rows.length === 0) {
      throw new BadRequestException('Excel-filen indeholder ingen opgaver');
    }

    const invalidRows = rows.filter((row) => !row.valid).length;

    return {
      valid: invalidRows === 0,
      totalRows: rows.length,

      validRows: rows.length - invalidRows,

      invalidRows,

      rows,
    };
  }

  async importTasks(buffer: Buffer, selectedRows: number[]) {
    if (selectedRows.length === 0) {
      throw new BadRequestException('Vælg mindst én opgave til import');
    }

    const uniqueRows = [...new Set(selectedRows)];

    const preview = await this.previewImport(buffer);

    const selectedPreviewRows = preview.rows.filter((row) =>
      uniqueRows.includes(row.rowNumber),
    );

    if (selectedPreviewRows.length !== uniqueRows.length) {
      throw new BadRequestException(
        'En eller flere valgte rækker findes ikke i Excel-filen',
      );
    }

    const invalidRows = selectedPreviewRows.filter((row) => !row.valid);

    if (invalidRows.length > 0) {
      throw new BadRequestException(
        `Følgende rækker kan ikke importeres: ${invalidRows
          .map((row) => row.rowNumber)
          .join(', ')}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const importedTasks: {
        rowNumber: number;
        id: string;
        name: string;
      }[] = [];

      for (const row of selectedPreviewRows) {
        const data = row.data;

        if (
          data.environmentId === null ||
          data.taskTypeId === null ||
          data.status === null
        ) {
          throw new BadRequestException(
            `Række ${row.rowNumber} mangler gyldige stamdata`,
          );
        }

        const task = await tx.task.create({
          data: {
            name: data.name,

            description: data.description,

            instructions: data.instructions,

            instructorInstructions: data.instructorInstructions,

            environmentId: data.environmentId,

            taskTypeId: data.taskTypeId,

            status: data.status,

            answerType: data.answerType,

            ...(data.options.length > 0
              ? {
                  options: {
                    create: data.options,
                  },
                }
              : {}),

            ...(data.checklistItems.length > 0
              ? {
                  checklistItems: {
                    create: data.checklistItems,
                  },
                }
              : {}),
          },

          select: {
            id: true,
            name: true,
          },
        });

        importedTasks.push({
          rowNumber: row.rowNumber,

          id: task.id,
          name: task.name,
        });
      }

      return {
        importedCount: importedTasks.length,

        importedTasks,
      };
    });
  }

  private createGuideSheet(worksheet: Worksheet) {
    worksheet.columns = [
      {
        width: 25,
      },
      {
        width: 80,
      },
    ];

    const rows = [
      [
        'Excel-import af opgaver',
        'Én række i arket "Opgaver" svarer til én opgave.',
      ],
      [
        'Obligatoriske felter',
        'Navn, Instruktioner, Miljø, Opgavetype og Status.',
      ],
      ['Status', 'ACTIVE, DRAFT eller ARCHIVED.'],
      ['Quiz', 'Svartype udfyldes kun for opgaver af typen Quiz.'],
      [
        'MULTIPLE_CHOICE',
        'Svarmuligheder adskilles med |. Eksempel: Nord|Syd|Øst. Korrekte svar angives med nummer, eksempel: 1|3.',
      ],
      [
        'YES_NO',
        'Sæt Svartype til YES_NO og skriv JA eller NEJ i Korrekte svar.',
      ],
      ['FREE_TEXT', 'Svarmuligheder og Korrekte svar skal være tomme.'],
      [
        'Tjekliste',
        'Tjeklistepunkter adskilles med |. Eksempel: Kontrollér radio|Tag redningsvest på|Meld klar.',
      ],
      [
        'Miljø og opgavetype',
        'Vælg værdierne fra dropdown-menuerne. De hentes fra systemets database.',
      ],
    ];

    worksheet.addRows(rows);

    worksheet.getRow(1).font = {
      bold: true,
      color: {
        argb: 'FFFFFFFF',
      },
    };

    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: 'FF21483E',
      },
    };

    worksheet.eachRow((row) => {
      row.alignment = {
        vertical: 'top',
        wrapText: true,
      };
    });
  }
  //HELPERS TIL VALIDERING AF EXCEL DATA
  private parseRow(
    rowNumber: number,
    values: string[],

    environments: {
      id: number;
      name: string;
    }[],

    taskTypes: {
      id: number;
      code: string;
      name: string;
    }[],

    existingTasks: {
      id: string;
      name: string;
      environmentId: number;
      taskTypeId: number;
    }[],
  ): ImportPreviewRow {
    const [
      name,
      description,
      instructions,
      instructorInstructions,
      environmentName,
      taskTypeName,
      statusRaw,
      answerTypeRaw,
      optionsRaw,
      correctAnswersRaw,
      checklistRaw,
    ] = values;

    const errors: string[] = [];

    const environment = environments.find(
      (item) => item.name.toLowerCase() === environmentName.toLowerCase(),
    );

    const taskType = taskTypes.find(
      (item) => item.name.toLowerCase() === taskTypeName.toLowerCase(),
    );

    const existingTask =
      environment && taskType
        ? existingTasks.find(
            (task) =>
              this.normalizeName(task.name) === this.normalizeName(name) &&
              task.environmentId === environment.id &&
              task.taskTypeId === taskType.id,
          )
        : undefined;

    if (!name) {
      errors.push('Navn er obligatorisk');
    }

    if (!instructions) {
      errors.push('Instruktioner er obligatoriske');
    }

    if (!environmentName) {
      errors.push('Miljø er obligatorisk');
    } else if (!environment) {
      errors.push(`Ukendt miljø "${environmentName}"`);
    }

    if (!taskTypeName) {
      errors.push('Opgavetype er obligatorisk');
    } else if (!taskType) {
      errors.push(`Ukendt opgavetype "${taskTypeName}"`);
    }

    const status = this.parseTaskStatus(statusRaw);

    if (!status) {
      errors.push(`Ugyldig status "${statusRaw}"`);
    }

    let answerType: AnswerType | null = null;

    let options: ImportOption[] = [];

    let checklistItems: ImportChecklistItem[] = [];

    if (taskType?.code === 'QUIZ') {
      answerType = this.parseAnswerType(answerTypeRaw);

      if (!answerType) {
        errors.push('Quiz-opgaver skal have en gyldig svartype');
      } else if (answerType === AnswerType.MULTIPLE_CHOICE) {
        options = this.parseMultipleChoice(
          optionsRaw,
          correctAnswersRaw,
          errors,
        );
      } else if (answerType === AnswerType.YES_NO) {
        options = this.parseYesNo(correctAnswersRaw, errors);
      }
    } else if (answerTypeRaw || optionsRaw || correctAnswersRaw) {
      errors.push('Svarfelter må kun udfyldes for Quiz-opgaver');
    }

    if (taskType?.code === 'CHECKLIST') {
      checklistItems = this.splitValues(checklistRaw).map(
        (itemText, index) => ({
          itemText,
          sortOrder: index,
        }),
      );

      if (checklistItems.length === 0) {
        errors.push('Tjekliste-opgaver skal have mindst ét punkt');
      }
    } else if (checklistRaw) {
      errors.push('Tjeklistepunkter må kun udfyldes for Tjekliste-opgaver');
    }

    return {
      rowNumber,
      valid: errors.length === 0,
      errors,

      duplicate: existingTask !== undefined,

      existingTask: existingTask
        ? {
            id: existingTask.id,
            name: existingTask.name,
          }
        : null,

      data: {
        name,
        description: description || null,

        instructions,

        instructorInstructions: instructorInstructions || null,

        environmentId: environment?.id ?? null,

        environmentName,

        taskTypeId: taskType?.id ?? null,

        taskTypeCode: taskType?.code ?? null,

        taskTypeName,

        status,
        answerType,
        options,
        checklistItems,
      },
    };
  }
  private parseTaskStatus(value: string): TaskStatus | null {
    const normalized = value.trim().toUpperCase();

    if (Object.values(TaskStatus).includes(normalized as TaskStatus)) {
      return normalized as TaskStatus;
    }

    return null;
  }
  private parseAnswerType(value: string): AnswerType | null {
    const normalized = value.trim().toUpperCase();

    if (Object.values(AnswerType).includes(normalized as AnswerType)) {
      return normalized as AnswerType;
    }

    return null;
  }
  private splitValues(value: string) {
    return value
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  private parseMultipleChoice(
    optionsRaw: string,
    correctAnswersRaw: string,
    errors: string[],
  ): ImportOption[] {
    const values = this.splitValues(optionsRaw);

    if (values.length < 2) {
      errors.push('Multiple choice skal have mindst to svarmuligheder');

      return [];
    }

    const correctIndexes = this.splitValues(correctAnswersRaw).map(Number);

    if (correctIndexes.length === 0) {
      errors.push('Multiple choice skal have mindst ét korrekt svar');
    }

    const invalidIndex = correctIndexes.some(
      (index) => !Number.isInteger(index) || index < 1 || index > values.length,
    );

    if (invalidIndex) {
      errors.push('Korrekte svar indeholder et ugyldigt nummer');
    }

    const correctSet = new Set(correctIndexes);

    return values.map((optionText, index) => ({
      optionText,

      isCorrect: correctSet.has(index + 1),

      sortOrder: index,
    }));
  }
  private parseYesNo(
    correctAnswerRaw: string,
    errors: string[],
  ): ImportOption[] {
    const normalized = correctAnswerRaw.trim().toUpperCase();

    const yesValues = ['JA', 'YES'];

    const noValues = ['NEJ', 'NO'];

    const yesCorrect = yesValues.includes(normalized);

    const noCorrect = noValues.includes(normalized);

    if (!yesCorrect && !noCorrect) {
      errors.push('YES_NO skal have JA eller NEJ som korrekt svar');
    }

    return [
      {
        optionText: 'Ja',
        isCorrect: yesCorrect,
        sortOrder: 0,
      },
      {
        optionText: 'Nej',
        isCorrect: noCorrect,
        sortOrder: 1,
      },
    ];
  }
  private normalizeName(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }
}
