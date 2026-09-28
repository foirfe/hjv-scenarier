import Dexie, {
  type Table,
} from "dexie";

import type { RunDetail } from "../types/scenarioRun";

export type CachedRun = {
  userId: string;
  runId: string;

  cachedAt: number;

  data: RunDetail;
};

export type SyncActionType =
  | "COMPLETE_TASK"
  | "CHECKLIST_ITEM"
  | "SUBMIT_ANSWER"
  | "GEO_ACTIVATE";

export type SyncQueueItem = {
  id: string;

  userId: string;
  runId: string;
  taskId: string;

  type: SyncActionType;

  payload: unknown;

  createdAt: number;

  attempts: number;

  lastError?: string;
};

class HjvOfflineDatabase
  extends Dexie {
  runs!: Table<CachedRun, [string, string]>;

  syncQueue!: Table< SyncQueueItem, string>;

  constructor() {
    super("hjv-offline");
    this.version(1).stores({
      runs:
        "[userId+runId],userId,runId,cachedAt",
    });
    this.version(2).stores({
      runs:
        "[userId+runId],userId,runId,cachedAt",
      syncQueue:
        "id,userId,runId,taskId,type,createdAt",
    });
  }
}

export const offlineDb =
  new HjvOfflineDatabase();