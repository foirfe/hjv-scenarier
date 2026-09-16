export type ScenarioRole =
  | "PARTICIPANT"
  | "TEAM_LEADER"
  | "INSTRUCTOR";

export type ScenarioRunStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ABORTED";

export type TaskProgressStatus =
  | "LOCKED"
  | "AVAILABLE"
  | "ACTIVE"
  | "COMPLETED";

export type ActivationMode =
  | "GEO"
  | "AUTOMATIC"
  | "MANUAL";

export type AnswerType =
  | "MULTIPLE_CHOICE"
  | "FREE_TEXT"
  | "YES_NO";

export type RunTaskOption = {
  id: string;
  optionText: string;
  sortOrder: number;
};

export type RunTaskChecklistItem = {
  id: string;
  itemText: string;
  sortOrder: number;
};

export type RunTask = {
  id: string;
  name: string;

  description: string | null;
  instructions: string | null;

  answerType: AnswerType | null;
  taskTypeCode: string | null;

  activationMode: ActivationMode | null;

  latitude: string | null;
  longitude: string | null;
  radiusMeters: number | null;

  status: TaskProgressStatus | null;

  availableAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  options: RunTaskOption[];

  checklistItems: RunTaskChecklistItem[];
  checkedChecklistItemIds: string[];

  dependencies: {
    prerequisiteRunTaskId: string;
  }[];
};

export type RunDetail = {
  id: string;

  status: ScenarioRunStatus;

  startedAt: string | null;
  completedAt: string | null;

  role: ScenarioRole;

  scenario: {
    id: string;
    name: string;
    description: string | null;
  };

  tasks: RunTask[];
};