import type {
  InstructorRunDetail,
} from "../../types/scenarioRun";

import InstructorTaskCard from "./InstructorTaskCard";
import styles from "./InstructorRunView.module.css";

type Props = {
  run: InstructorRunDetail;

  onActivate: (
    taskId: string,
    userId: string,
  ) => void;

  activationError: string | null;
  activatingKey: string | null;

  onCompleteRun: () => void;
  onAbortRun: () => void;

  runAction:
    | "complete"
    | "abort"
    | null;

  runControlError: string | null;
};

export default function InstructorRunView({
  run,
  onActivate,
  activationError,
  activatingKey,
  onCompleteRun,
  onAbortRun,
  runAction,
  runControlError,
}: Props) {
  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          Instruktørvisning
        </p>

        <h2>
          {run.scenario.name}
        </h2>

        {run.scenario.description && (
          <p className={styles.description}>
            {run.scenario.description}
          </p>
        )}
      </header>

      {activationError && (
        <p
          role="alert"
          className={styles.error}
        >
          {activationError}
        </p>
      )}

      <div className={styles.taskList}>
        {run.tasks.map((task) => (
          <InstructorTaskCard
            key={task.id}
            task={task}
            onActivate={onActivate}
            activatingKey={
              activatingKey
            }
          />
        ))}
      </div>

      {run.status === "IN_PROGRESS" && (
        <section
          className={styles.runControls}
        >
          <div
            className={styles.runControlsText}
          >
            <h3>
              Afslut afvikling
            </h3>
            <p>
              Afslut normalt når øvelsen
              er færdig, eller afbryd den
              hvis den stoppes før tid.
            </p>
          </div>

          <div
            className={
              styles.runControlButtons
            }
          >
            <button
              type="button"
              className={
                styles.completeButton
              }
              disabled={
                runAction !== null
              }
              onClick={onCompleteRun}
            >
              {runAction === "complete"
                ? "Afslutter..."
                : "Afslut afvikling"}
            </button>

            <button
              type="button"
              className={
                styles.abortButton
              }
              disabled={
                runAction !== null
              }
              onClick={onAbortRun}
            >
              {runAction === "abort"
                ? "Afbryder..."
                : "Afbryd afvikling"}
            </button>
          </div>

          {runControlError && (
            <p
              role="alert"
              className={styles.error}
            >
              {runControlError}
            </p>
          )}
        </section>
      )}
    </section>
  );
}