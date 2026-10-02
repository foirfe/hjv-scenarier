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

export function updateChecklistItemLocally(
    run: RunDetail,
    taskId: string,
    itemId: string,
    checked: boolean,
): RunDetail {
    if (
        run.role === "INSTRUCTOR"
    ) {
        return run;
    }
    return {
        ...run,

        tasks: run.tasks.map(
            (task) => {
                if (
                    task.id !== taskId
                ) {
                    return task;
                }

                const currentIds = task.checkedChecklistItemIds;

                const updatedIds =
                    checked
                        ? Array.from(new Set([...currentIds, itemId]))
                        : currentIds.filter(
                            (id) =>
                                id !== itemId,
                        );

                return {
                    ...task,
                    checkedChecklistItemIds:
                        updatedIds,
                };
            },
        ),
    };
}

export function markGeoTasksActiveLocally(
    run: RunDetail,
    taskIds: string[],
    observedAt: string,
): RunDetail {
    if (
        run.role ===
        "INSTRUCTOR"
    ) {
        return run;
    }

    const taskIdSet =
        new Set(taskIds);

    return {
        ...run,

        tasks:
            run.tasks.map(
                (task) => {
                    if (!taskIdSet.has(task.id)) {
                        return task;
                    }

                    return {
                        ...task,

                        status:
                            "ACTIVE" as const,

                        startedAt:
                            observedAt,
                    };
                },
            ),
    };
}