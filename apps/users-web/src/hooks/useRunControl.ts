import { useState } from "react";
import { apiFetch } from "../api/apiFetch";

type Action =
  | "complete"
  | "abort";

type Options = {
  runId: string;
  onChanged:
    () => void | Promise<void>;
};

export function useRunControl({
  runId,
  onChanged,
}: Options) {
  const [action, setAction] = useState<Action | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function completeRun() {
    const confirmed = window.confirm(
      "Vil du afslutte afviklingen? Deltagerne kan ikke fortsætte bagefter.",
    );
    if (!confirmed) return;
    try {
      setAction("complete");
      setError(null);
      await apiFetch(
        `/scenario-runs/${runId}/complete`,
        {
          method: "PATCH",
        },
      );
      await onChanged();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Afviklingen kunne ikke afsluttes",
      );
    } finally {
      setAction(null);
    }
  }

  async function abortRun() {
    const confirmed = window.confirm(
      "Vil du afbryde afviklingen? Dette markerer den som afbrudt.",
    );

    if (!confirmed) return;

    try {
      setAction("abort");
      setError(null);

      await apiFetch(
        `/scenario-runs/${runId}/abort`,
        {
          method: "PATCH",
        },
      );

      await onChanged();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Afviklingen kunne ikke afbrydes",
      );
    } finally {
      setAction(null);
    }
  }

  return {
    completeRun,
    abortRun,
    action,
    error,
  };
}