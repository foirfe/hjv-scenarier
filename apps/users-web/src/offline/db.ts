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

class HjvOfflineDatabase
  extends Dexie {
  runs!: Table<CachedRun, [string, string]>;

  constructor() {
    super("hjv-offline");
    this.version(1).stores({
      runs:
        "[userId+runId],userId,runId,cachedAt",
    });
  }
}

export const offlineDb =
  new HjvOfflineDatabase();