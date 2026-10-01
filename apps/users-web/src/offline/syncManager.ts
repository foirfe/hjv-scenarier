import { apiFetch, NetworkError, } from "../api/apiFetch";

import { getSyncQueue, markSyncFailed, removeFromSyncQueue } from "./syncQueue";

export const RUN_SYNCED_EVENT = "hjv-run-synced";

let activeSync: Promise<void> | null = null;

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
            switch (item.type) {
                case "COMPLETE_TASK":
                    await apiFetch(
                        `/scenario-runs/${item.runId}/tasks/${item.taskId}/complete`,
                        { method: "PATCH" },
                    );

                    break;

                default:
                    return;
            }

            await removeFromSyncQueue(item.id);

            syncedRuns.add(item.runId);
        } catch (error) {
            if (error instanceof NetworkError) {
                return;
            }
            await markSyncFailed(item.id, error,);
            return;
        }
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