import { useState } from "react";
import { apiFetch, NetworkError } from "../api/apiFetch";
import { useApiStatus } from "./useApiStatus";
import { queueChecklistItem } from "../offline/syncQueue";

type ChecklistResponse = {
  checkedChecklistItemIds: string[];
  allChecked: boolean;
};

type UseChecklistOptions = {
  runId: string;
  userId: | string | undefined;
  taskId: string;
  checklistItemIds: string[];
  initialCheckedItemIds: string[];
  onChangedLocally:
  (
    taskId: string,
    itemId: string,
    checked: boolean,
  ) => void | Promise<void>;
};

export function useChecklist({
  runId,
  userId,
  taskId,
  checklistItemIds,
  initialCheckedItemIds,
  onChangedLocally,
}: UseChecklistOptions) {
  const [checkedItemIds, setCheckedItemIds] = useState<string[]>(initialCheckedItemIds);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [allChecked, setAllChecked] =
    useState(checklistItemIds.length > 0 && checklistItemIds.every((id) => initialCheckedItemIds.includes(id)));
  const apiStatus = useApiStatus();

  async function applyLocalChange(
    itemId: string,
    checked: boolean,
  ) {
    setCheckedItemIds(
      (current) => {
        const updatedIds =
          checked
            ? Array.from(
              new Set([
                ...current,
                itemId,
              ]),
            )
            : current.filter(
              (id) =>
                id !== itemId,
            );

        setAllChecked(checklistItemIds.length > 0 && checklistItemIds.every(
          (id) =>
            updatedIds.includes(id),
        ),
        );
        return updatedIds;
      },
    );
    await onChangedLocally(taskId, itemId, checked,
    );
  }

  async function updateItem(
    itemId: string,
    checked: boolean,
  ) {
    if (updatingItemId || !userId) {
      return;
    }

    setUpdatingItemId(itemId);
    setError(null);

    try {
      if (
        apiStatus === "offline"
      ) {
        await queueChecklistItem(
          userId,
          runId,
          taskId,
          itemId,
          checked,
        );

        await applyLocalChange(itemId, checked);

        return;
      }

      try {
        const response =
          await apiFetch<ChecklistResponse>(
            `/scenario-runs/${runId}/tasks/${taskId}/checklist/${itemId}`,
            {
              method:
                "PATCH",

              body:
                JSON.stringify({
                  checked,
                }),
            },
          );

        setCheckedItemIds(response.checkedChecklistItemIds,);

        setAllChecked(response.allChecked,);

        await onChangedLocally(
          taskId,
          itemId,
          checked,
        );
      } catch (error) {
        if (error instanceof NetworkError) {
          await queueChecklistItem(userId, runId, taskId, itemId, checked);

          await applyLocalChange(itemId, checked,);

          return;
        }

        throw error;
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Tjeklistepunktet kunne ikke opdateres",
      );
    } finally {
      setUpdatingItemId(null);
    }
  }

  return {
    checkedItemIds,
    updatingItemId,
    allChecked,
    error,
    updateItem,
  };
}