import type { ActivationMode, RunTask, TaskProgressStatus } from "../types/scenarioRun";
import TaskAnswer from "./task-answers/TaskAnswer";
import ChecklistTask from "./checklist/ChecklistTask";
import styles from "./TaskCard.module.css";
//HELPER FUNKTIONER
function getTaskStatusLabel(
  status: TaskProgressStatus | null,
) {
  switch (status) {
    case "LOCKED":
      return "Låst";

    case "AVAILABLE":
      return "Tilgængelig";

    case "ACTIVE":
      return "Aktiv";

    case "COMPLETED":
      return "Gennemført";

    default:
      return "Ingen status";
  }
}
function getActivationLabel(
  mode: ActivationMode,
) {
  switch (mode) {
    case "GEO":
      return "GPS";

    case "AUTOMATIC":
      return "Automatisk";

    case "MANUAL":
      return "Instruktør";
  }
}
function getStatusClass(
  status: TaskProgressStatus | null,
) {
  switch (status) {
    case "LOCKED":
      return styles.locked;

    case "AVAILABLE":
      return styles.available;

    case "ACTIVE":
      return styles.active;

    case "COMPLETED":
      return styles.completed;

    default:
      return styles.locked;
  }
}
type TaskCardProps = {
  runId: string,
  task: RunTask;
  userId: string | undefined;
  onComplete: (taskId: string) => void;
  completing: boolean;
  onAnswered: () => void | Promise<void>
  onChecklistChanged: (taskId: string, itemId: string, checked: boolean,) => void | Promise<void>;
};

export default function TaskCard({
  runId,
  task,
  userId,
  onComplete,
  completing,
  onAnswered,
  onChecklistChanged,
}: TaskCardProps) {
  if (task.status === "COMPLETED") {
    return (
      <details className={`${styles.card} ${styles.completedCard}`}>
        <summary className={styles.completedSummary}>
          <div
            className={styles.completedSummaryMain}>
            <div className={styles.meta}>
              <span className={`${styles.badge} ${styles.completed}`}>
                {getTaskStatusLabel(
                  task.status,
                )}
              </span>

              {task.activationMode && (
                <span className={styles.badge}>
                  {getActivationLabel(
                    task.activationMode,
                  )}
                </span>
              )}
            </div>

            <h3>{task.name}</h3>
          </div>

          <span className={styles.completedToggle}>
            Vis detaljer
          </span>
        </summary>

        <div className={styles.completedContent}>
          <ActiveTaskContent task={task} />
        </div>
      </details>
    );
  }
  return (
    <article className={styles.card}>
      <div className={styles.meta}>
        <span
          className={`${styles.badge} ${getStatusClass(task.status)}`}
        >
          {getTaskStatusLabel(task.status)}
        </span>

        {task.activationMode && (
          <span className={styles.badge}>
            {getActivationLabel(task.activationMode)}
          </span>
        )}
      </div>

      <h3>{task.name}</h3>

      {task.status === "LOCKED" && (
        <p>Denne opgave er låst.</p>
      )}

      {task.status === "AVAILABLE" &&
        task.activationMode === "GEO" && (
          <p>
            Opgaven er tilgængelig og venter på
            GPS-aktivering.
          </p>
        )}

      {task.status === "AVAILABLE" &&
        task.activationMode === "MANUAL" && (
          <p>
            Afventer aktivering fra instruktøren.
          </p>
        )}

      {task.status === "ACTIVE" && (
        <>
          <ActiveTaskContent task={task} />

          {task.taskTypeCode ===
            "CHECKLIST" ? (
            <ChecklistTask
              runId={runId}
              task={task}
              userId={userId}
              onComplete={onComplete}
              completing={completing}
              onChecklistChanged={onChecklistChanged}
            />
          ) : task.answerType ? (
            <TaskAnswer
              runId={runId}
              userId={userId}
              task={task}
              onAnswered={onAnswered}
            />
          ) : (
            <button
              type="button"
              disabled={completing}
              onClick={() =>
                onComplete(task.id)
              }
            >
              {completing ? "Færdiggør..." : "Markér som færdig"}
            </button>
          )}
        </>
      )}
    </article>
  );

  function ActiveTaskContent({
    task,
  }: {
    task: RunTask;
  }) {
    return (
      <>
        {task.description && (
          <p>{task.description}</p>
        )}
        {task.instructions && (
          <div className={styles.instructions}>
            <strong>Instruktion</strong>

            <p>{task.instructions}</p>
          </div>
        )}
      </>
    );
  }
}
