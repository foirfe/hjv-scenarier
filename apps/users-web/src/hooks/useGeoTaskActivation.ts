import {useEffect, useRef, useState} from "react";

import { apiFetch } from "../api/apiFetch";

import type {RunDetail,RunTask} from "../types/scenarioRun";

import type { UserPosition } from "./useGeolocation";

import {getDistanceMeters} from "../utils/getDistanceMeters";

type UseGeoTaskActivationOptions = {
  runId: string;
  run: RunDetail | null;
  position: UserPosition | null;
  onActivated: () => void | Promise<void>;
};

export function useGeoTaskActivation({
  runId,
  run,
  position,
  onActivated,
}: UseGeoTaskActivationOptions) {
  const pendingTaskIds = useRef(new Set<string>());
  const lastAttempt = useRef(new Map<string, number>());
  const [activationError, setActivationError] = useState<string | null>(null);

  useEffect(() => {
    if (!run || !position ||run.status !== "IN_PROGRESS"
    ) {
      return;
    }

    const now = Date.now();

    const tasksToActivate =
      run.tasks.filter((task) =>
        canActivateGeoTask(
          task,
          position,
          pendingTaskIds.current,
          lastAttempt.current,
          now,
        ),
      );

    if (tasksToActivate.length === 0) {
      return;
    }

    for (const task of tasksToActivate) {
      pendingTaskIds.current.add(task.id);
      lastAttempt.current.set(
        task.id,
        now,
      );
    }

    void Promise.allSettled(
      tasksToActivate.map((task) =>
        apiFetch<unknown>(
          `/scenario-runs/${runId}/tasks/${task.id}/activate`,
          {
            method: "PATCH",
            body: JSON.stringify({
              latitude:
                position.latitude,
              longitude:
                position.longitude,
              accuracyMeters:
                position.accuracy,
            }),
          },
        ),
      ),
    )
      .then((results) => {
        const successful =
          results.some(
            (result) =>
              result.status === "fulfilled",
          );

        const failed =
          results.find(
            (result) =>
              result.status === "rejected",
          );

        if (failed?.status === "rejected") {
          setActivationError(
            failed.reason instanceof Error
              ? failed.reason.message
              : "Opgaven kunne ikke aktiveres",
          );
        } else {
          setActivationError(null);
        }

        if (successful) {
          void onActivated();
        }
      })
      .finally(() => {
        for (const task of tasksToActivate) {
          pendingTaskIds.current.delete(
            task.id,
          );
        }
      });
  }, [
    runId,
    run,
    position,
    onActivated,
  ]);

  return {
    activationError,
  };
}

function canActivateGeoTask(
  task: RunTask,
  position: UserPosition,
  pendingTaskIds: Set<string>,
  lastAttempt: Map<string, number>,
  now: number,
) {
  if (
    task.status !== "AVAILABLE" ||
    task.activationMode !== "GEO" ||
    task.latitude === null ||
    task.longitude === null ||
    task.radiusMeters === null
  ) {
    return false;
  }

  if (pendingTaskIds.has(task.id)) {
    return false;
  }

  const previousAttempt =
    lastAttempt.get(task.id);

  if (
    previousAttempt !== undefined &&
    now - previousAttempt < 5_000
  ) {
    return false;
  }

  const taskLatitude =
    Number(task.latitude);

  const taskLongitude =
    Number(task.longitude);

  if (
    !Number.isFinite(taskLatitude) ||
    !Number.isFinite(taskLongitude)
  ) {
    return false;
  }

  const distance =
    getDistanceMeters(position.latitude, position.longitude, taskLatitude,taskLongitude);
  return distance <= task.radiusMeters;
}