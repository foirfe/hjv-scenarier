import type {
  InstructorRunTask,
  TaskProgressStatus,
} from "../../types/scenarioRun";

import styles from "./InstructorTaskCard.module.css";

type Props = {
  task: InstructorRunTask;

  onActivate: (
    taskId: string,
    userId: string,
  ) => void;

  activatingKey: string | null;
};

export default function InstructorTaskCard({
  task,
  onActivate,
  activatingKey,
}: Props) {
  const availableCount =
    task.participants.filter(
      (participant) =>
        participant.status === "AVAILABLE",
    ).length;

  const activeCount =
    task.participants.filter(
      (participant) =>
        participant.status === "ACTIVE",
    ).length;

  const completedCount =
    task.participants.filter(
      (participant) =>
        participant.status === "COMPLETED",
    ).length;

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div>
          <span className={styles.type}>
            {task.taskTypeCode}
          </span>

          <h3>{task.name}</h3>
        </div>

        <span className={styles.activationBadge}>
          {getActivationLabel(
            task.activationMode,
          )}
        </span>
      </div>

      {task.description && (
        <p>{task.description}</p>
      )}

      {task.instructorInstructions && (
        <section
          className={
            styles.instructorInstructions
          }
        >
          <strong>
            Instruktion til instruktør
          </strong>

          <p>
            {task.instructorInstructions}
          </p>
        </section>
      )}

      <div className={styles.summary}>
        <span>
          Tilgængelig: {availableCount}
        </span>

        <span>
          Aktiv: {activeCount}
        </span>

        <span>
          Gennemført: {completedCount}
        </span>
      </div>

      <div className={styles.participants}>
        {task.participants.map(
          (participant) => {
            const key =
              `${task.id}:${participant.userId}`;

            const activating =
              activatingKey === key;

            const canActivate =
              task.activationMode === "MANUAL" &&
              participant.status ===
                "AVAILABLE";

            return (
              <div
                key={participant.userId}
                className={styles.participant}
              >
                <div className={styles.participantIdentity}>
                  <strong>
                    {participant.displayName}
                  </strong>

                  <small>
                    @{participant.username}
                  </small>
                </div>

                <span
                  className={`${styles.status} ${
                    styles[
                      participant.status.toLowerCase()
                    ]
                  }`}
                >
                  {getStatusLabel(
                    participant.status,
                  )}
                </span>

                {canActivate && (
                  <button
                    type="button"
                    className={styles.activateButton}
                    disabled={
                      activatingKey !== null
                    }
                    onClick={() =>
                      onActivate(
                        task.id,
                        participant.userId,
                      )
                    }
                  >
                    {activating ? "Aktiverer..." : "Aktivér"}
                  </button>
                )}
              </div>
            );
          },
        )}
      </div>
    </article>
  );
}

function getStatusLabel(
  status: TaskProgressStatus,
) {
  switch (status) {
    case "LOCKED":
      return "Låst";

    case "AVAILABLE":
      return "Klar";

    case "ACTIVE":
      return "Aktiv";

    case "COMPLETED":
      return "Gennemført";
  }
}

function getActivationLabel(
  mode: InstructorRunTask["activationMode"],
) {
  switch (mode) {
    case "GEO":
      return "GPS";

    case "AUTOMATIC":
      return "Automatisk";

    case "MANUAL":
      return "Manuel";
  }
}