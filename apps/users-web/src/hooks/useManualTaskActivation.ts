import { useState } from "react";
import { apiFetch } from "../api/apiFetch";

type Options = {
  runId: string;
  onActivated:
    () => void | Promise<void>;
};

export function useManualTaskActivation({
  runId,
  onActivated,
}: Options) {
  const [activatingKey,setActivatingKey] = useState<string | null>(null);

  const [activationError,setActivationError] = useState<string | null>(null);

  async function activateTask(
    taskId: string,
    userId: string,
  ) {
    const key =
      `${taskId}:${userId}`;

    if (activatingKey) {
      return;
    }

    setActivatingKey(key);
    setActivationError(null);

    try {
      await apiFetch(
        `/scenario-runs/${runId}/tasks/${taskId}/activate-manual/${userId}`,
        {
          method: "PATCH",
        },
      );

      await onActivated();
    } catch (error) {
      setActivationError(
        error instanceof Error
          ? error.message
          : "Opgaven kunne ikke aktiveres",
      );
    } finally {
      setActivatingKey(null);
    }
  }

  return {
    activateTask,
    activatingKey,
    activationError,
  };
}