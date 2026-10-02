import { useEffect, useRef, useState } from "react";

import { apiFetch, NetworkError } from "../api/apiFetch";
import { useApiStatus } from "./useApiStatus";
import { queueGeoActivation, type GeoActivationPayload } from "../offline/syncQueue";
import type { ParticipantRunDetail, RunTask } from "../types/scenarioRun";

import type { UserPosition } from "./useGeolocation";

import { getDistanceMeters } from "../utils/getDistanceMeters";

type UseGeoTaskActivationOptions = {
  runId: string;
  userId: string | undefined;
  run: ParticipantRunDetail | null;
  position: UserPosition | null;
  onActivated: () => void | Promise<void>;
  onActivatedLocally: (taskIds: string[], observedAt: string) => void | Promise<void>;
};

export function useGeoTaskActivation({
  runId,
  userId,
  run,
  position,
  onActivated,
  onActivatedLocally,
}: UseGeoTaskActivationOptions) {
  const pendingTaskIds = useRef(new Set<string>());
  const lastAttempt = useRef(new Map<string, number>());
  const [activationError, setActivationError] = useState<string | null>(null);
  const apiStatus = useApiStatus();

  useEffect(() => {
    if (
      !userId ||
      !run ||
      !position ||
      run.status !== "IN_PROGRESS"
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
    const observedAt = new Date().toISOString();

    const payload:
      GeoActivationPayload = {
      latitude:
        position.latitude,

      longitude:
        position.longitude,

      accuracyMeters:
        position.accuracy,

      observedAt,
    };

    void (async () => {
      const locallyActivatedIds: string[] = [];
      let serverActivated = false;
      let firstError: unknown = null;

      for (const task of tasksToActivate) {
        try {
          if (apiStatus === "offline") {
            await queueGeoActivation(
              userId,
              runId,
              task.id,
              payload,
            );

            locallyActivatedIds.push(
              task.id,
            );

            continue;
          }

          try {
            await apiFetch(
              `/scenario-runs/${runId}/tasks/${task.id}/activate`,
              {
                method: "PATCH",
                body: JSON.stringify(
                  payload,
                ),
              },
            );

            serverActivated = true;
          } catch (error) {
            if (
              error instanceof
              NetworkError
            ) {
              await queueGeoActivation(
                userId,
                runId,
                task.id,
                payload,
              );

              locallyActivatedIds.push(
                task.id,
              );

              continue;
            }

            throw error;
          }
        } catch (error) {
          firstError ??= error;
        }
      }

      if (locallyActivatedIds.length > 0) {
        await onActivatedLocally(
          locallyActivatedIds,
          observedAt,
        );
      }

      if (serverActivated) {
        await onActivated();
      }

      if (firstError) {
        setActivationError(
          firstError instanceof Error
            ? firstError.message
            : "Opgaven kunne ikke aktiveres",
        );
      } else {
        setActivationError(
          null,
        );
      }
    })().finally(() => {
      for (
        const task
        of tasksToActivate
      ) {
        pendingTaskIds.current.delete(
          task.id,
        );
      }
    });
  }, [
    apiStatus,
    runId,
    run,
    position,
    onActivated,
    onActivatedLocally,
    userId,
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
    getDistanceMeters(position.latitude, position.longitude, taskLatitude, taskLongitude);
  return distance <= task.radiusMeters;
}