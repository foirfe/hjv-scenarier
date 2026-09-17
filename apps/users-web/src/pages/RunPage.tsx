import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { apiFetch } from "../api/apiFetch";
import TaskCard from "../components/TaskCard";
import GpsStatus from "../components/GpsStatus";
import { useGeolocation } from "../hooks/useGeolocation";
import { useManualTaskActivation } from "../hooks/useManualTaskActivation";
import InstructorRunView from "../components/instructor/InstructorRunView";
import GeoGuide from "../components/GeoGuide";
import { useDeviceHeading } from "../hooks/useDeviceHeading";
import { useGeoTaskActivation, } from "../hooks/useGeoTaskActivation";
import { useTaskCompletion } from "../hooks/useTaskCompletion";
import type { RunDetail, ScenarioRole, ScenarioRunStatus } from "../types/scenarioRun";
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
  const [run, setRun] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    let cancelled = false;
    apiFetch<RunDetail>(
      `/scenario-runs/${runId}/me`,
    )
      .then((data) => {
        if (!cancelled) {
          setRun(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Kunne ikke hente øvelsen",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [runId]);

  const refreshRun =
    useCallback(async () => {
      if (!runId) {
        return;
      }
      const data =
        await apiFetch<RunDetail>(
          `/scenario-runs/${runId}/me`,
        );

      setRun(data);
    }, [runId]);
  //DEFINER OM DET ER DELTAGER ELLER INSTRUKTØR RUN
  const participantRun =run && run.role !== "INSTRUCTOR" ? run: null;
  const instructorRun = run?.role === "INSTRUCTOR" ? run : null;
  const { completeTask, completingTaskId, completionError } = useTaskCompletion({ runId: runId ?? "", onCompleted: refreshRun });

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

  const needsGps =
    participantRun?.status === "IN_PROGRESS" &&
    participantRun.tasks.some(
      (task) =>
        task.status === "AVAILABLE" &&
        task.activationMode === "GEO",
    );

  const { supported: gpsSupported, position, error: gpsError, locating, } = useGeolocation(needsGps ?? false);
  const { activationError } = useGeoTaskActivation({ runId: runId ?? "", run: participantRun, position, onActivated: refreshRun });
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
                    onComplete={completeTask}
                    completing={completingTaskId === task.id}
                    onAnswered={refreshRun}
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
              onActivate={
                activateManualTask
              }
              activatingKey={null}
              activationError={null}
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
                    onComplete={
                      completeTask
                    }
                    completing={false}
                    onAnswered={
                      refreshRun
                    }
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
