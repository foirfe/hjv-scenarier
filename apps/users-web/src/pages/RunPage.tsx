import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { NetworkError, apiFetch } from "../api/apiFetch";
import { useAuth } from "../auth/useAuth";
import { cacheRun, getCachedRun, markGeoTasksActiveLocally, updateChecklistItemLocally } from "../offline/runCache";
import { completeTaskLocally } from "../offline/localProgress";
import TaskCard from "../components/TaskCard";
import GpsStatus from "../components/GpsStatus";
import { useGeolocation } from "../hooks/useGeolocation";
import { useManualTaskActivation } from "../hooks/useManualTaskActivation";
import InstructorRunView from "../components/instructor/InstructorRunView";
import GeoGuide from "../components/GeoGuide";
import { useDeviceHeading } from "../hooks/useDeviceHeading";
import { useGeoTaskActivation, } from "../hooks/useGeoTaskActivation";
import { useTaskCompletion } from "../hooks/useTaskCompletion";
import type { RunDetail, ScenarioRole, ScenarioRunStatus, OfflineRunSnapshot } from "../types/scenarioRun";
import { cacheRunSnapshot, getCachedRunSnapshot, mergeRunWithSnapshot } from "../offline/runSnapshot";
import SyncStatus from "../components/SyncStatus";
import { RUN_SYNCED_EVENT } from "../offline/syncManager";
import { useRunControl } from "../hooks/useRunControl";
import styles from "./RunPage.module.css";

//HELPER FUNKTIONER
function getRunStatusLabel(
  status: ScenarioRunStatus,
) {
  switch (status) {
    case "NOT_STARTED":
      return "Ikke startet";
    case "IN_PROGRESS":
      return "I gang";
    case "COMPLETED":
      return "Afsluttet";
    case "ABORTED":
      return "Afbrudt";
  }
}

function getRoleLabel(
  role: ScenarioRole,
) {
  switch (role) {
    case "PARTICIPANT":
      return "Deltager";

    case "TEAM_LEADER":
      return "Holdleder";

    case "INSTRUCTOR":
      return "Instruktør";
  }
}

export default function RunPage() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [run, setRun] = useState<RunDetail | null>(null);
  const [offlineSnapshot, setOfflineSnapshot,] = useState<OfflineRunSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const userId = user?.id;

  async function ensureOfflineSnapshot(
    userId: string,
    runId: string,
  ): Promise<
    OfflineRunSnapshot | null
  > {
    const existing =
      await getCachedRunSnapshot(
        userId,
        runId,
      );

    if (existing) {
      return existing.data;
    }

    try {
      const snapshot = await apiFetch<OfflineRunSnapshot>(`/scenario-runs/${runId}/offline-snapshot`);

      await cacheRunSnapshot(userId, snapshot);

      return snapshot;
    } catch (error) {
      console.error(
        "Offline snapshot kunne ikke hentes:",
        error,
      );

      return null;
    }
  }

  useEffect(() => {
    if (!runId || !userId) {
      return;
    }

    const currentRunId = runId;
    const currentUserId = userId;

    let cancelled = false;

    async function loadRun() {
      try {
        const data = await apiFetch<RunDetail>(`/scenario-runs/${currentRunId}/me`);

        if (cancelled) {
          return;
        }
        let snapshot: OfflineRunSnapshot | null = null;

        if (
          data.role !== "INSTRUCTOR" && data.status === "IN_PROGRESS") {
          snapshot =
            await ensureOfflineSnapshot(
              currentUserId,
              currentRunId,
            );
        }

        const mergedRun =
          snapshot
            ? mergeRunWithSnapshot(
              data,
              snapshot,
            )
            : data;

        if (cancelled) {
          return;
        }

        setOfflineSnapshot(snapshot);

        setRun(mergedRun,);

        setError("");

        void cacheRun(
          currentUserId,
          mergedRun,
        ).catch((error) => {
          console.error(
            "Run kunne ikke caches:",
            error,
          );
        });
      } catch (error) {
        if (
          error instanceof
          NetworkError
        ) {
          const cachedRun =
            await getCachedRun(
              currentUserId,
              currentRunId,
            );
          if (cancelled) {
            return;
          }
          const cachedSnapshot = await getCachedRunSnapshot(currentUserId, currentRunId);
          if (cachedRun) {
            const snapshot = cachedSnapshot?.data ?? null;
            const mergedRun = snapshot ? mergeRunWithSnapshot(cachedRun.data, snapshot,) : cachedRun.data;

            setOfflineSnapshot(snapshot,);

            setRun(mergedRun);

            setError("");

            return;
          }
          setError(
            "Serveren kan ikke nås, og der findes ingen offline-kopi af denne øvelse.",
          );

          return;
        }
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Kunne ikke hente øvelsen",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }

    }
    void loadRun();



    return () => {
      cancelled = true;
    };
  }, [runId, userId]);



  const handleLocalChecklistChange =
    useCallback(
      async (
        taskId: string,
        itemId: string,
        checked: boolean,
      ) => {
        if (!run || !userId) {
          return;
        }
        const updatedRun =
          updateChecklistItemLocally(
            run,
            taskId,
            itemId,
            checked,
          );

        const mergedRun = offlineSnapshot ? mergeRunWithSnapshot(updatedRun, offlineSnapshot) : updatedRun;

        setRun(mergedRun);

        await cacheRun(
          userId,
          mergedRun,
        );
      },
      [run, userId, offlineSnapshot],
    );

  const refreshRun =
    useCallback(async () => {
      if (!runId) {
        return;
      }

      const data = await apiFetch<RunDetail>(`/scenario-runs/${runId}/me`);

      const mergedRun = offlineSnapshot ? mergeRunWithSnapshot(data, offlineSnapshot) : data;

      setRun(mergedRun);

      if (userId) {
        void cacheRun(
          userId,
          mergedRun,
        ).catch((error) => {
          console.error(
            "Run kunne ikke caches:",
            error,
          );
        });
      }
    }, [runId, userId, offlineSnapshot]);

  useEffect(() => {
    function handleRunSynced(
      event: Event,
    ) {
      const syncEvent =
        event as CustomEvent<{
          runId: string;
        }>;
      if (syncEvent.detail.runId !== runId) {
        return;
      }
      void refreshRun();
    }
    window.addEventListener(RUN_SYNCED_EVENT, handleRunSynced,);

    return () => {
      window.removeEventListener(RUN_SYNCED_EVENT, handleRunSynced,);
    };
  }, [runId, refreshRun]);

  const handleLocalTaskCompleted =
    useCallback(
      async (taskId: string) => {
        if (!userId || !offlineSnapshot) {
          return;
        }

        setRun(
          (currentRun) => {
            if (!currentRun) {
              return currentRun;
            }

            const progressedRun = completeTaskLocally(currentRun, offlineSnapshot, taskId);

            const mergedRun = mergeRunWithSnapshot(progressedRun, offlineSnapshot,);

            void cacheRun(userId, mergedRun)
              .catch((error) => {
                console.error("Lokal progress kunne ikke gemmes:", error);
              });

            return mergedRun;
          },
        );
      },
      [userId, offlineSnapshot],
    );

  const handleLocalGeoActivated =
    useCallback(
      async (
        taskIds: string[],
        observedAt: string,
      ) => {
        if (!userId) {
          return;
        }

        setRun(
          (currentRun) => {
            if (!currentRun) {
              return currentRun;
            }

            const updatedRun =
              markGeoTasksActiveLocally(
                currentRun,
                taskIds,
                observedAt,
              );

            const mergedRun =
              offlineSnapshot
                ? mergeRunWithSnapshot(
                  updatedRun,
                  offlineSnapshot,
                )
                : updatedRun;

            void cacheRun(
              userId,
              mergedRun,
            ).catch((error) => {
              console.error(
                "GPS-aktivering kunne ikke gemmes lokalt:",
                error,
              );
            });

            return mergedRun;
          },
        );
      },
      [userId, offlineSnapshot],
    );
  //DEFINER OM DET ER DELTAGER ELLER INSTRUKTØR RUN
  const participantRun = run && run.role !== "INSTRUCTOR" ? run : null;
  const instructorRun = run?.role === "INSTRUCTOR" ? run : null;
  const { completeTask, completingTaskId, completionError, } = useTaskCompletion({ runId: runId ?? "", userId, onCompleted: refreshRun, onCompletedLocally: handleLocalTaskCompleted, });

  const {
    activateTask:
    activateManualTask,
    activatingKey:
    manualActivatingKey,
    activationError:
    manualActivationError,
  } = useManualTaskActivation({
    runId: runId ?? "",
    onActivated: refreshRun,
  });

  const { completeRun, abortRun, action: runAction, error: runControlError } = useRunControl({
    runId: runId ?? "",
    onChanged: refreshRun,
  });

  const needsGps =
    participantRun?.status === "IN_PROGRESS" &&
    participantRun.tasks.some(
      (task) =>
        task.status === "AVAILABLE" &&
        task.activationMode === "GEO",
    );



  const { supported: gpsSupported, position, error: gpsError, locating, } = useGeolocation(needsGps ?? false);
  const { activationError } = useGeoTaskActivation({ runId: runId ?? "", userId, run: participantRun, position, onActivated: refreshRun, onActivatedLocally: handleLocalGeoActivated });
  const { heading, enabled: compassEnabled, error: compassError, requestPermission: enableCompass } = useDeviceHeading();
  if (!runId) {
    return (
      <main>
        <p>Ugyldigt run-id.</p>

        <button type="button" onClick={() => navigate("/runs")}
        >
          Tilbage
        </button>
      </main>
    );
  }
  if (loading) {
    return <p>Henter øvelse...</p>;
  }
  if (error) {
    return (
      <main>
        <p role="alert">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/runs")}>
          Tilbage
        </button>
      </main>
    );
  }
  if (!run) {
    return null;
  }

  return (
    <main className={styles.page}>
      <button
        className={styles.backButton}
        type="button"
        onClick={() => navigate("/runs")}
      >
        ← Mine øvelser
      </button>
      <SyncStatus />
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          {getRoleLabel(run.role)}
        </p>

        <h1>
          {run.name ?? run.scenario.name}
        </h1>

        {run.scenario.description && (
          <p className={styles.description}>
            {run.scenario.description}
          </p>
        )}

        <p>
          Status:{" "}
          <strong>
            {getRunStatusLabel(run.status)}
          </strong>
        </p>
      </header>

      {run.status ===
        "NOT_STARTED" && (
          <section>
            <h2>
              Øvelsen er ikke startet
            </h2>

            <p>
              Afvent at øvelsen bliver
              startet.
            </p>
          </section>
        )}

      {run.status === "IN_PROGRESS" && (
        <section>
          <h2>Opgaver</h2>

          {participantRun && needsGps && (
            <>
              <GpsStatus
                supported={gpsSupported}
                locating={locating}
                position={position}
                error={gpsError}
                activationError={
                  activationError
                }
              />

              <GeoGuide
                tasks={participantRun.tasks}
                position={position}
                heading={heading}
                compassEnabled={
                  compassEnabled
                }
                onEnableCompass={
                  enableCompass
                }
                compassError={
                  compassError
                }
              />
            </>
          )}

          {instructorRun ? (
            <InstructorRunView
              run={instructorRun}
              onActivate={activateManualTask}
              activatingKey={manualActivatingKey}
              activationError={manualActivationError}
              onCompleteRun={completeRun}
              onAbortRun={abortRun}
              runAction={runAction}
              runControlError={runControlError}
            />
          ) : participantRun ? (
            <div
              className={styles.taskList}
            >
              {participantRun.tasks.map(
                (task) => (
                  <TaskCard
                    key={task.id}
                    runId={
                      participantRun.id
                    }
                    task={task}
                    userId={userId}
                    onComplete={completeTask}
                    completing={completingTaskId === task.id}
                    onAnswered={refreshRun}
                    onChecklistChanged={handleLocalChecklistChange}
                  />
                ),
              )}
            </div>
          ) : null}
        </section>
      )}

      {run.status === "COMPLETED" && (
        <section>
          <h2>Øvelsen er afsluttet</h2>

          {instructorRun ? (
            <InstructorRunView
              run={instructorRun}
              onActivate={activateManualTask}
              activatingKey={manualActivatingKey}
              activationError={manualActivationError}
              onCompleteRun={completeRun}
              onAbortRun={abortRun}
              runAction={runAction}
              runControlError={runControlError}
            />
          ) : participantRun ? (
            <div
              className={styles.taskList}
            >
              {participantRun.tasks.map(
                (task) => (
                  <TaskCard
                    key={task.id}
                    runId={
                      participantRun.id
                    }
                    task={task}
                    userId={userId}
                    onComplete={completeTask}
                    completing={false}
                    onAnswered={refreshRun}
                    onChecklistChanged={handleLocalChecklistChange}
                  />
                ),
              )}
            </div>
          ) : null}
        </section>
      )}

      {run.status === "ABORTED" && (
        <section>
          <h2>
            Øvelsen blev afbrudt
          </h2>
        </section>
      )}
      {completionError && (
        <p role="alert">{completionError}</p>
      )}
    </main>
  );
}
