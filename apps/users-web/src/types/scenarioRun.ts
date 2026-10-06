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

type RunBase = {
  id: string;
  name: string | null;
  status: ScenarioRunStatus;

  startedAt: string | null;
  completedAt: string | null;

  scenario: {
    id: string;
    name: string;
    description: string | null;
  };
};

export type ParticipantRunDetail =
  RunBase & {
    role:
      | "PARTICIPANT"
      | "TEAM_LEADER";

    tasks: RunTask[];
  };

export type InstructorRunDetail =
  RunBase & {
    role: "INSTRUCTOR";

    tasks: InstructorRunTask[];
  };

export type RunDetail =
  | ParticipantRunDetail
  | InstructorRunDetail;



export type InstructorTaskParticipant = {
  userId: string;
  displayName: string;
  username: string;

  status: TaskProgressStatus;

  availableAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type InstructorRunTask = {
  id: string;
  name: string;

  description: string | null;
  instructions: string | null;
  instructorInstructions: string | null;

  answerType: AnswerType | null;
  taskTypeCode: string | null;

  activationMode: ActivationMode;

  manualActivatedAt: string | null;

  participants: InstructorTaskParticipant[];
};

export type OfflineTaskDefinition = {
  id: string;

  name: string;

  description:
    string | null;

  instructions:
    string | null;

  answerType:
    AnswerType | null;

  taskTypeCode:
    string | null;

  activationMode:
    ActivationMode;

  latitude:
    string | null;

  longitude:
    string | null;

  radiusMeters:
    number | null;

  manualActivatedAt:
    string | null;

  options:
    RunTaskOption[];

  checklistItems:
    RunTaskChecklistItem[];

  dependencies: {
    prerequisiteRunTaskId:
      string;
  }[];
};

export type OfflineRunSnapshot = {
  runId: string;

  tasks:
    OfflineTaskDefinition[];
};