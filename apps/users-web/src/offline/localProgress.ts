import type { OfflineRunSnapshot, RunDetail } from "../types/scenarioRun";

export function completeTaskLocally(
    run: RunDetail,
    snapshot: OfflineRunSnapshot,
    taskId: string,
): RunDetail {
    if (run.role === "INSTRUCTOR" || run.id !== snapshot.runId) {
        return run;
    }

    const completedAt = new Date().toISOString();

    let tasks = run.tasks.map((task) => task.id === taskId ? {
        ...task,
        status:
            "COMPLETED" as const,
        completedAt,
    }
        : task,
    );

    const definitionsById = new Map(snapshot.tasks.map((task) => [task.id, task]));

    const completedIds = new Set(tasks.filter((task) => task.status === "COMPLETED",).map((task) => task.id));

    tasks = tasks.map((task) => {
        if (task.status !== "LOCKED") {
            return task;
        }

        const definition = definitionsById.get(task.id);

        if (!definition) {
            return task;
        }

        const dependsOnCompletedTask = definition.dependencies.some((dependency) => dependency.prerequisiteRunTaskId === taskId);

        if (!dependsOnCompletedTask) {
            return task;
        }

        const allPrerequisitesCompleted =
            definition.dependencies.every(
                (dependency) =>
                    completedIds.has(
                        dependency
                            .prerequisiteRunTaskId,
                    ),
            );

        if (!allPrerequisitesCompleted) {
            return task;
        }

        const shouldActivate = definition.activationMode === "AUTOMATIC" || (definition.activationMode === "MANUAL" && definition.manualActivatedAt !== null);

        if (shouldActivate) {
            return {
                ...task,
                status: "ACTIVE" as const,

                availableAt: completedAt,

                startedAt: completedAt,
            };
        }

        return {
            ...task,

            status: "AVAILABLE" as const,

            availableAt: completedAt,
        };
    },
    );

    return {
        ...run,
        tasks,
    };
}