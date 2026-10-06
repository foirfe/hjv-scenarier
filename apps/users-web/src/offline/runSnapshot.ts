import type { OfflineRunSnapshot, RunDetail } from "../types/scenarioRun";

import { offlineDb } from "./db";

export async function cacheRunSnapshot(
    userId: string,
    snapshot:
        OfflineRunSnapshot,
) {
    await offlineDb.runSnapshots.put({
        userId,
        runId: snapshot.runId,
        cachedAt: Date.now(),
        data: snapshot,
    });
}

export async function getCachedRunSnapshot(
    userId: string,
    runId: string,
) {
    return offlineDb.runSnapshots.get([
        userId,
        runId,
    ]);
}

export function mergeRunWithSnapshot(
  run: RunDetail,
  snapshot: OfflineRunSnapshot,
): RunDetail {
  if (
    run.role === "INSTRUCTOR" ||
    run.id !== snapshot.runId
  ) {
    return run;
  }

  const definitionsById =
    new Map(
      snapshot.tasks.map(
        (task) => [
          task.id,
          task,
        ],
      ),
    );

  return {
    ...run,

    tasks: run.tasks.map(
      (task) => {
        const definition =
          definitionsById.get(
            task.id,
          );

        if (!definition) {
          return task;
        }

        const isUnlocked =
          task.status !==
            "LOCKED" &&
          task.status !== null;

        const canSeeContent =
          task.status ===
            "ACTIVE" ||
          task.status ===
            "COMPLETED";

        const canSeeLocation =
          task.status ===
            "AVAILABLE" &&
          definition.activationMode ===
            "GEO";

        const isChecklist =
          definition.taskTypeCode ===
            "CHECKLIST";

        return {
          ...task,

          name:
            isUnlocked
              ? definition.name
              : "Låst opgave",

          activationMode:
            isUnlocked
              ? definition.activationMode
              : null,

          description:
            canSeeContent
              ? definition.description
              : null,

          instructions:
            canSeeContent
              ? definition.instructions
              : null,

          answerType:
            canSeeContent
              ? definition.answerType
              : null,

          taskTypeCode:
            canSeeContent
              ? definition.taskTypeCode
              : null,

          options:
            canSeeContent
              ? definition.options
              : [],

          checklistItems:
            canSeeContent &&
            isChecklist
              ? definition
                  .checklistItems
              : [],

          checkedChecklistItemIds:
            canSeeContent &&
            isChecklist
              ? (
                  task
                    .checkedChecklistItemIds ??
                  []
                )
              : [],

          latitude:
            canSeeLocation
              ? definition.latitude
              : null,

          longitude:
            canSeeLocation ? definition.longitude  : null,

          radiusMeters:
            canSeeLocation? definition.radiusMeters : null,
          dependencies:
            definition.dependencies,
        };
      },
    ),
  };
}