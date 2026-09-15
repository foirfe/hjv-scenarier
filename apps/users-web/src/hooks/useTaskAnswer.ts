import { useState } from "react";
import { apiFetch } from "../api/apiFetch";

import type {
  AnswerType,
  RunTask,
} from "../types/scenarioRun";

type SubmitAnswerResponse = {
  correct: boolean | null;
  completed: boolean;
};

type UseTaskAnswerOptions = {
  runId: string;
  task: RunTask;
  onAnswered: () => void | Promise<void>;
};

export function useTaskAnswer({
  runId,
  task,
  onAnswered,
}: UseTaskAnswerOptions) {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitAnswerResponse | null>(null);

  function toggleOption(optionId: string) {
    setResult(null);
    setError(null);
    setSelectedOptionIds((current) => current.includes(optionId) ? current.filter((id) => id !== optionId,) : [...current, optionId],
    );
  }

  function selectSingleOption(
    optionId: string,
  ) {
    setResult(null);
    setError(null);
    setSelectedOptionIds([optionId]);
  }

  function updateTextAnswer(
    value: string,
  ) {
    setResult(null);
    setError(null);
    setTextAnswer(value);
  }

  async function submitAnswer() {
    if (!task.answerType) {
      return;
    }

    if (!canSubmitAnswer(
      task.answerType,
      selectedOptionIds,
      textAnswer,
    )) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response =
        await apiFetch<SubmitAnswerResponse>(
          `/scenario-runs/${runId}/tasks/${task.id}/answer`,
          {
            method: "POST",

            body: JSON.stringify(
              createPayload(
                task.answerType,
                selectedOptionIds,
                textAnswer,
              ),
            ),
          },
        );

      setResult(response);

      if (response.completed) {
        await onAnswered();
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Svaret kunne ikke sendes",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    task.answerType !== null &&
    canSubmitAnswer(
      task.answerType,
      selectedOptionIds,
      textAnswer,
    );

  return {
    selectedOptionIds,
    textAnswer,
    submitting,
    error,
    result,
    canSubmit,
    toggleOption,
    selectSingleOption,
    updateTextAnswer,
    submitAnswer,
  };
}

function canSubmitAnswer(
  answerType: AnswerType,
  selectedOptionIds: string[],
  textAnswer: string,
) {
  switch (answerType) {
    case "MULTIPLE_CHOICE":
    case "YES_NO":
      return selectedOptionIds.length > 0;
    case "FREE_TEXT":
      return textAnswer.trim().length > 0;
  }
}

function createPayload(
  answerType: AnswerType,
  selectedOptionIds: string[],
  textAnswer: string,
) {
  switch (answerType) {
    case "MULTIPLE_CHOICE":
    case "YES_NO":
      return {
        selectedOptionIds,
      };

    case "FREE_TEXT":
      return {
        textAnswer:
          textAnswer.trim(),
      };
  }
}