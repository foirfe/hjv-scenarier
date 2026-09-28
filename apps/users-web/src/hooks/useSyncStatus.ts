import { useEffect, useState } from "react";
import { liveQuery } from "dexie";
import { offlineDb } from "../offline/db";
import { useApiStatus } from "./useApiStatus";

type QueueState = {
    pendingCount: number;
    failedCount: number;
};

export function useSyncStatus(userId: string | undefined) {
    const apiStatus = useApiStatus();
    const [queueState, setQueueState] = useState<QueueState>({
        pendingCount: 0,
        failedCount: 0,
    });

    useEffect(() => {
        if (!userId) {
            return;
        }

        const subscription = liveQuery(async () => {
            const items = await offlineDb.syncQueue
                .where("userId")
                .equals(userId)
                .toArray();

            return {
                pendingCount: items.length,
                failedCount: items.filter((item) => Boolean(item.lastError)).length,
            };
        }).subscribe({
            next: (state) => {
                setQueueState(state);
            },
            error: (error) => {
                console.error("Kunne ikke læse sync-status:", error);
            },
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [userId]);

    return {
        apiStatus,
        online: apiStatus === "online",
        pendingCount: queueState.pendingCount,
        failedCount: queueState.failedCount,
    };
}