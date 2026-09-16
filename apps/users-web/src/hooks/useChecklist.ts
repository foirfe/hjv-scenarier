import { useState } from "react";
import { apiFetch } from "../api/apiFetch";

type ChecklistResponse = {
  checkedChecklistItemIds: string[];
  allChecked: boolean;
};

type UseChecklistOptions = {
  runId: string;
  taskId: string;
  checklistItemIds: string[];
  initialCheckedItemIds: string[];
};

export function useChecklist({
  runId,
  taskId,
  checklistItemIds,
  initialCheckedItemIds,
}: UseChecklistOptions) {
  const [checkedItemIds, setCheckedItemIds] = useState<string[]>(initialCheckedItemIds);

  const [updatingItemId,setUpdatingItemId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [allChecked, setAllChecked] = 
  useState(checklistItemIds.length > 0 && checklistItemIds.every((id) =>initialCheckedItemIds.includes(id)),
    );

  async function updateItem(
    itemId: string,
    checked: boolean,
  ) {
    if (updatingItemId) {
      return;
    }

    setUpdatingItemId(itemId);
    setError(null);

    try {
      const response =
        await apiFetch<ChecklistResponse>(
          `/scenario-runs/${runId}/tasks/${taskId}/checklist/${itemId}`,
          {
            method: "PATCH",

            body: JSON.stringify({
              checked,
            }),
          },
        );

      setCheckedItemIds(response.checkedChecklistItemIds);

      setAllChecked(response.allChecked);
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