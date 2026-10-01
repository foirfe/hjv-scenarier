import {
    useEffect,
} from "react";

import { useAuth } from "../auth/useAuth";

import { useApiStatus, } from "../hooks/useApiStatus";

import { syncPendingChanges, } from "../offline/syncManager";

export default function SyncQueueProcessor() {
    const { user } =
        useAuth();

    const apiStatus =
        useApiStatus();

    const userId =
        user?.id;

    useEffect(() => {
        if (!userId) {
            return;
        }

        function trySync() {
            void syncPendingChanges(
                userId!,
            );
        }

        // Online eller unknown prøver med det samme.
        if (apiStatus !== "offline") {
            trySync();
        }

        // Hvis selve API'et har været nede, men browserenstadig har internet,kommer "online"-eventet ikke nødvendigvis.
        // Derfor prøver vi igen med intervaller.
        const interval = window.setInterval(trySync, 10_000,);
        return () => {
            window.clearInterval(
                interval,
            );
        };
    }, [userId, apiStatus]);
    return null;
}