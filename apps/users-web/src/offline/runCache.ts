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