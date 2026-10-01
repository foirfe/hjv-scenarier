import type { RunDetail } from "../types/scenarioRun";

import { offlineDb } from "./db";

export async function cacheRun(
    userId: string,
    run: RunDetail,
) {
    await offlineDb.runs.put({
        userId,
        runId: run.id,
        cachedAt: Date.now(),
        data: run,
    });
}

export async function getCachedRun(
    userId: string,
    runId: string,
) {
    return offlineDb.runs.get([
        userId,
        runId,
    ]);
}

export function markTaskCompletedLocally(
  run: RunDetail,
  taskId: string,
): RunDetail {
  if (run.role === "INSTRUCTOR") {
    return run;
  }
  const completedAt = new Date().toISOString();
  return {
    ...run,
    tasks: run.tasks.map(
      (task) =>
        task.id === taskId
          ? {
              ...task,
              status:
                "COMPLETED" as const,
              completedAt,
            }
          : task,
    ),
  };
}