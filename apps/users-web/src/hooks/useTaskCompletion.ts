import { useState } from "react";
import { apiFetch, NetworkError } from "../api/apiFetch";
import { useApiStatus } from "./useApiStatus";
import { queueCompleteTask } from "../offline/syncQueue";

type UseTaskCompletionOptions = {
    runId: string;
    userId: | string | undefined;
    onCompleted: () => void | Promise<void>;

    onCompletedLocally: (taskId: string,) => void | Promise<void>;
};

export function useTaskCompletion({
    runId,
    userId,
    onCompleted,
    onCompletedLocally,
}: UseTaskCompletionOptions) {
    const apiStatus = useApiStatus();
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
    const [completionError, setCompletionError] = useState<string | null>(null);

    async function queueCompletion(
        taskId: string,
    ) {
        if (!userId) {
            throw new Error("Brugeren kunne ikke identificeres");
        }
        await queueCompleteTask(userId, runId, taskId);
        await onCompletedLocally(taskId);
    }

    async function completeTask(
        taskId: string,
    ) {
        if (completingTaskId) {
            return;
        }

        setCompletingTaskId(
            taskId,
        );

        setCompletionError(
            null,
        );

        try {
            if (apiStatus === "offline") {
                await queueCompletion(taskId);
                return;
            }
            try {
                await apiFetch(
                    `/scenario-runs/${runId}/tasks/${taskId}/complete`,
                    { method: "PATCH" },
                );
            } catch (error) {
                // Kun netværksfejl skal blive lagt i kø.
                if ( error instanceof NetworkError
                ) {
                    await queueCompletion(
                        taskId,
                    );
                    return;
                }

                throw error;
            }
            await onCompletedLocally(
                taskId,
            );
            try {
                await onCompleted();
            } catch (error) {
                if (
                    !(error instanceof NetworkError)
                ) {
                    console.error(
                        "Run kunne ikke genindlæses:",
                        error,
                    );
                }
            }
        } catch (error) {
            setCompletionError(
                error instanceof Error ? error.message : "Opgaven kunne ikke færdiggøres",
            );
        } finally {
            setCompletingTaskId(
                null,
            );
        }
    }
    return {
        completeTask,
        completingTaskId,
        completionError,
    };
}