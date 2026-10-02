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

type ChecklistPayload = {
  itemId: string;
  checked: boolean;
};

export type GeoActivationPayload = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  observedAt: string;
};

export type SubmitAnswerPayload = | { selectedOptionIds: string[]; } | { textAnswer: string; };

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

export async function queueCompleteTask(
  userId: string,
  runId: string,
  taskId: string,
) {
  const existing =
    await offlineDb.syncQueue
      .where("userId")
      .equals(userId)
      .filter(
        (item) =>
          item.runId === runId &&
          item.taskId === taskId &&
          item.type ===
          "COMPLETE_TASK",
      )
      .first();

  if (existing) {
    return existing;
  }

  return addToSyncQueue({
    userId,
    runId,
    taskId,
    type: "COMPLETE_TASK",
  });
}

export async function queueChecklistItem(
  userId: string,
  runId: string,
  taskId: string,
  itemId: string,
  checked: boolean,
) {
  const existing =
    await offlineDb.syncQueue
      .where("userId")
      .equals(userId)
      .filter(
        (item) =>
          item.runId === runId &&
          item.taskId === taskId &&
          item.type ===
          "CHECKLIST_ITEM" &&
          (
            item.payload as
            | ChecklistPayload
            | null
          )?.itemId === itemId,
      )
      .first();

  const payload:
    ChecklistPayload = { itemId, checked, };

  if (existing) {
    await offlineDb.syncQueue.update(existing.id,
      {
        payload,
        attempts: 0,
        lastError: undefined,
      },
    );

    return {
      ...existing,
      payload,
    };
  }

  return addToSyncQueue({
    userId,
    runId,
    taskId,
    type: "CHECKLIST_ITEM",
    payload,
  });
}

export async function queueTaskAnswer(
  userId: string,
  runId: string,
  taskId: string,
  payload:
    SubmitAnswerPayload,
) {
  const existing =
    await offlineDb.syncQueue
      .where("userId")
      .equals(userId)
      .filter(
        (item) =>
          item.runId === runId &&
          item.taskId === taskId &&
          item.type ===
          "SUBMIT_ANSWER",
      )
      .first();

  if (existing) {
    await offlineDb.syncQueue.update(
      existing.id,
      {
        payload,
        attempts: 0,
        lastError: "",
      },
    );

    return {
      ...existing,
      payload,
      attempts: 0,
      lastError: "",
    };
  }

  return addToSyncQueue({
    userId,
    runId,
    taskId,
    type: "SUBMIT_ANSWER",
    payload,
  });
}

export async function getQueuedTaskAnswer(
  userId: string,
  runId: string,
  taskId: string,
) {
  return offlineDb.syncQueue
    .where("userId")
    .equals(userId)
    .filter(
      (item) =>
        item.runId === runId &&
        item.taskId === taskId &&
        item.type ===
        "SUBMIT_ANSWER",
    )
    .first();
}

export async function queueGeoActivation(
  userId: string,
  runId: string,
  taskId: string,
  payload:
    GeoActivationPayload,
) {
  const existing =
    await offlineDb.syncQueue
      .where("userId")
      .equals(userId)
      .filter(
        (item) =>
          item.runId === runId &&
          item.taskId === taskId &&
          item.type ===
            "GEO_ACTIVATE",
      )
      .first();

  // Beholder den første position,hvor brugeren faktisk ramte zonen.
  if (existing) {
    return existing;
  }

  return addToSyncQueue({
    userId,
    runId,
    taskId,
    type: "GEO_ACTIVATE",
    payload,
  });
}