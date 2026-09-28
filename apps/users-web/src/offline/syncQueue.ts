import {
  offlineDb,
  type SyncActionType,
  type SyncQueueItem,
} from "./db";

type AddSyncItemOptions = {
  userId: string;
  runId: string;
  taskId: string;

  type: SyncActionType;

  payload?: unknown;
};

export async function addToSyncQueue({
  userId,
  runId,
  taskId,
  type,
  payload = null,
}: AddSyncItemOptions) {
  const item: SyncQueueItem = {
    id: crypto.randomUUID(),

    userId,
    runId,
    taskId,

    type,

    payload,

    createdAt: Date.now(),

    attempts: 0,
  };

  await offlineDb.syncQueue.add(
    item,
  );

  return item;
}

export async function getSyncQueue(
  userId: string,
) {
  return offlineDb.syncQueue
    .where("userId")
    .equals(userId)
    .sortBy("createdAt");
}

export async function getRunSyncQueue(
  userId: string,
  runId: string,
) {
  const items =
    await offlineDb.syncQueue
      .where("userId")
      .equals(userId)
      .toArray();

  return items
    .filter(
      (item) =>
        item.runId === runId,
    )
    .sort(
      (a, b) =>
        a.createdAt -
        b.createdAt,
    );
}

export async function removeFromSyncQueue(
  id: string,
) {
  await offlineDb.syncQueue.delete(
    id,
  );
}

export async function markSyncFailed(
  id: string,
  error: unknown,
) {
  const item =
    await offlineDb.syncQueue.get(id);

  if (!item) {
    return;
  }

  await offlineDb.syncQueue.update(
    id,
    {
      attempts:
        item.attempts + 1,

      lastError:
        error instanceof Error
          ? error.message
          : "Ukendt synkroniseringsfejl",
    },
  );
}

export async function getPendingSyncCount(
  userId: string,
) {
  return offlineDb.syncQueue
    .where("userId")
    .equals(userId)
    .count();
}