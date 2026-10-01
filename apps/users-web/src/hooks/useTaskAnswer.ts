import { useState, useEffect } from "react";
import { liveQuery } from "dexie";
import { apiFetch, NetworkError } from "../api/apiFetch";
import { useApiStatus } from "./useApiStatus";
import { getQueuedTaskAnswer, queueTaskAnswer, type SubmitAnswerPayload } from "../offline/syncQueue";
import { ANSWER_SYNCED_EVENT, } from "../offline/syncManager";

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
  userId: | string | undefined;
  task: RunTask;
  onAnswered: () => void | Promise<void>;
};

export function useTaskAnswer({
  runId,
  userId,
  task,
  onAnswered,
}: UseTaskAnswerOptions) {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitAnswerResponse | null>(null);
  const [pending, setPending] = useState(false);
  const apiStatus = useApiStatus();

  useEffect(() => {
    if (!userId) {
      return;
    }
    const subscription =
      liveQuery(() => getQueuedTaskAnswer(
        userId,
        runId,
        task.id,
      ),
      ).subscribe({
        next: (item) => {
          setPending(
            Boolean(item),
          );
          if (!item) {
            return;
          }
          const payload =
            item.payload as
            SubmitAnswerPayload;
          if (
            "selectedOptionIds"
            in payload
          ) {
            setSelectedOptionIds(payload.selectedOptionIds);
          }

          if (
            "textAnswer"
            in payload
          ) {
            setTextAnswer(payload.textAnswer);
          }
        },

        error: (error) => {
          console.error(
            "Queued answer kunne ikke læses:",
            error,
          );
        },
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [
    userId,
    runId,
    task.id,
  ]);
  useEffect(() => {
    function handleAnswerSynced(
      event: Event,
    ) {
      const syncEvent =
        event as CustomEvent<{
          runId: string;
          taskId: string;

          result:
          SubmitAnswerResponse;
        }>;

      if (syncEvent.detail.runId !== runId || syncEvent.detail.taskId !== task.id) {
        return;
      }

      setPending(false);

      setResult(
        syncEvent.detail.result,
      );
    }

    window.addEventListener(
      ANSWER_SYNCED_EVENT,
      handleAnswerSynced,
    );

    return () => {
      window.removeEventListener(
        ANSWER_SYNCED_EVENT,
        handleAnswerSynced,
      );
    };
  }, [runId, task.id,]);

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
    if (
      !task.answerType ||
      !userId ||
      pending
    ) {
      return;
    }

    if (
      !canSubmitAnswer(
        task.answerType,
        selectedOptionIds,
        textAnswer,
      )
    ) {
      return;
    }

    const payload =
      createPayload(
        task.answerType,
        selectedOptionIds,
        textAnswer,
      );

    setSubmitting(true);
    setError(null);
    setResult(null);

    async function queueAnswer() {
      if (!userId) return;
      await queueTaskAnswer(
        userId,
        runId,
        task.id,
        payload,
      );

      setPending(true);
    }

    try {
      if (apiStatus === "offline") {
        await queueAnswer();

        return;
      }

      let response:
        SubmitAnswerResponse;

      try {
        response =
          await apiFetch<
            SubmitAnswerResponse
          >(
            `/scenario-runs/${runId}/tasks/${task.id}/answer`,
            {
              method:
                "POST",

              body:
                JSON.stringify(
                  payload,
                ),
            },
          );
      } catch (error) {
        if (error instanceof NetworkError) {
          await queueAnswer();
          return;
        }
        throw error;
      }

      setResult(response);

      if (
        response.completed
      ) {
        try {
          await onAnswered();
        } catch (error) {
          if (
            !(error instanceof NetworkError)
          ) {
            console.error("Run kunne ikke genindlæses:", error,);
          }
        }
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
    pending,
    error,
    result,
    canSubmit: canSubmit && !pending,
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