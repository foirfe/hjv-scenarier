import type { RunTask } from "../../types/scenarioRun";

import { useTaskAnswer } from "../../hooks/useTaskAnswer";

import MultipleChoiceAnswer from "./MultipleChoiceAnswer";
import YesNoAnswer from "./YesNoAnswer";
import FreeTextAnswer from "./FreeTextAnswer";

type TaskAnswerProps = {
  runId: string;
  userId: string | undefined;
  task: RunTask;
  onAnswered:
  () => void | Promise<void>;
};

export default function TaskAnswer({
  runId,
  userId,
  task,
  onAnswered,
}: TaskAnswerProps) {
  const answer =
    useTaskAnswer({
      runId,
      userId,
      task,
      onAnswered,
    });

  if (!task.answerType) {
    return null;
  }

  return (
    <div>
      {task.answerType === "MULTIPLE_CHOICE" && (
        <MultipleChoiceAnswer
          task={task}
          selectedOptionIds={
            answer.selectedOptionIds
          }
          onToggleOption={
            answer.toggleOption
          }
          disabled={answer.pending}
        />
      )}

      {task.answerType === "YES_NO" && (
        <YesNoAnswer
          task={task}
          selectedOptionIds={
            answer.selectedOptionIds
          }
          onSelectOption={
            answer.selectSingleOption
          }
          disabled={answer.pending}
        />
      )}

      {task.answerType ===
        "FREE_TEXT" && (
          <FreeTextAnswer
            value={answer.textAnswer}
            onChange={
              answer.updateTextAnswer
            }
            disabled={answer.pending}
          />
        )}

      {answer.pending && (
        <p role="status">
          Svaret er gemt lokalt og
          afventer synkronisering.
        </p>
      )}

      {answer.result?.correct === false && (
        <p role="alert">
          Svaret er ikke korrekt.
          Prøv igen.
        </p>
      )}

      {answer.error && (
        <p role="alert">
          {answer.error}
        </p>
      )}

      <button
        type="button"
        disabled={
          !answer.canSubmit ||
          answer.submitting ||
          answer.pending
        }
        onClick={() => void answer.submitAnswer()}>
        {answer.pending
          ? "Svar gemt"
          : answer.submitting
            ? "Sender svar..."
            : "Send svar"}
      </button>
    </div>
  );
}