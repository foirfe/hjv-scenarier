import type {ActivationMode, RunTask, TaskProgressStatus} from "../types/scenarioRun";
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
  task: RunTask;
};

export default function TaskCard({
  task,
}: TaskCardProps) {
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
      <ActiveTaskContent task={task} />
    )}

    {task.status === "COMPLETED" && (
      <>
        <p>Opgaven er gennemført.</p>

        <ActiveTaskContent task={task} />
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
