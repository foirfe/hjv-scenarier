import type {RunTask} from "../../types/scenarioRun";

import {useChecklist} from "../../hooks/useChecklist";

import styles from "./ChecklistTask.module.css";

type Props = {
  runId: string;
  task: RunTask;

  onComplete:
    (taskId: string) => void;

  completing: boolean;
};

export default function ChecklistTask({
  runId,
  task,
  onComplete,
  completing,
}: Props) {
  const {
    checkedItemIds,
    updatingItemId,
    allChecked,
    error,
    updateItem,
  } = useChecklist({
    runId,
    taskId: task.id,

    checklistItemIds:
      task.checklistItems.map(
        (item) => item.id,
      ),

    initialCheckedItemIds:
      task.checkedChecklistItemIds,
  });

  const checkedCount =
    checkedItemIds.length;

  const totalCount =
    task.checklistItems.length;

  return (
    <section
      className={styles.checklist}
    >
      <div className={styles.header}>
        <strong>Tjekliste</strong>

        <span>
          {checkedCount} / {totalCount}
        </span>
      </div>

      <div className={styles.items}>
        {task.checklistItems.map(
          (item) => {
            const checked =
              checkedItemIds.includes(
                item.id,
              );

            const updating =
              updatingItemId === item.id;

            return (
              <label
                key={item.id}
                className={styles.item}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={
                    updatingItemId !== null
                  }
                  onChange={() =>
                    void updateItem(
                      item.id,
                      !checked,
                    )
                  }
                />

                <span>
                  {item.itemText}
                </span>

                {updating && (
                  <small>
                    Gemmer...
                  </small>
                )}
              </label>
            );
          },
        )}
      </div>

      {error && (
        <p role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={
          !allChecked ||
          completing ||
          updatingItemId !== null
        }
        onClick={() =>
          onComplete(task.id)
        }
      >
        {completing
          ? "Færdiggør..."
          : "Færdiggør tjekliste"}
      </button>
    </section>
  );
}