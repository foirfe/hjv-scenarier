import { apiFetch, NetworkError, } from "../api/apiFetch";
import type { SubmitAnswerPayload } from "./syncQueue";
import { getSyncQueue, markSyncFailed, removeFromSyncQueue, } from "./syncQueue";

export const RUN_SYNCED_EVENT = "hjv-run-synced";
export const ANSWER_SYNCED_EVENT = "hjv-answer-synced";

let activeSync: Promise<void> | null = null;

type ChecklistPayload = {
    itemId: string;
    checked: boolean;
};

type SubmitAnswerResponse = {
    correct:
    | boolean
    | null;
    completed: boolean;
};

export function syncPendingChanges(
    userId: string,
) {
    if (activeSync) {
        return activeSync;
    }

    activeSync =
        processQueue(userId)
            .finally(() => {
                activeSync =
                    null;
            });

    return activeSync;
}

async function processQueue(
    userId: string,
) {
    const items = await getSyncQueue(userId);

    const syncedRuns = new Set<string>();

    for (
        const item
        of items
    ) {
        try {
            let answerResult: SubmitAnswerResponse | null = null;
            switch (item.type) {
                case "COMPLETE_TASK":
                    await apiFetch(
                        `/scenario-runs/${item.runId}/tasks/${item.taskId}/complete`,
                        { method: "PATCH" },
                    );
                    break;
                case "CHECKLIST_ITEM": {
                    const payload =
                        item.payload as
                        ChecklistPayload;
                    if (
                        !payload || typeof payload.itemId !== "string" || typeof payload.checked !== "boolean") {
                        throw new Error(
                            "Ugyldig checklist sync-data",
                        );
                    }
                    await apiFetch(
                        `/scenario-runs/${item.runId}/tasks/${item.taskId}/checklist/${payload.itemId}`,
                        {
                            method: "PATCH",
                            body: JSON.stringify({
                                checked: payload.checked,
                            }),
                        },
                    );
                    break;
                }
                case "SUBMIT_ANSWER": {
                    const payload =
                        item.payload as
                        SubmitAnswerPayload;

                    answerResult =
                        await apiFetch<
                            SubmitAnswerResponse
                        >(
                            `/scenario-runs/${item.runId}/tasks/${item.taskId}/answer`,
                            {
                                method: "POST",

                                body:
                                    JSON.stringify(
                                        payload,
                                    ),
                            },
                        );

                    break;
                }

                default:
                    return;
            }

            await removeFromSyncQueue(item.id);
            if (answerResult) {
                window.dispatchEvent(
                    new CustomEvent(
                        ANSWER_SYNCED_EVENT,
                        {
                            detail: {
                                runId:
                                    item.runId,

                                taskId:
                                    item.taskId,

                                result:
                                    answerResult,
                            },
                        },
                    ),
                );
            }

            syncedRuns.add(item.runId);
        } catch (error) {
            if (error instanceof NetworkError) {
                break;
            }
            await markSyncFailed(
                item.id,
                error,
            );

            break;
        }
        for (
            const runId
            of syncedRuns
        ) {
            window.dispatchEvent(
                new CustomEvent(
                    RUN_SYNCED_EVENT,
                    {
                        detail: {
                            runId,
                        },
                    },
                ),
            );
        }
    }
}