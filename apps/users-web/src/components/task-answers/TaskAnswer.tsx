import type {RunTask} from "../../types/scenarioRun";

import { useTaskAnswer} from "../../hooks/useTaskAnswer";

import MultipleChoiceAnswer from "./MultipleChoiceAnswer";
import YesNoAnswer from "./YesNoAnswer";
import FreeTextAnswer from "./FreeTextAnswer";

type TaskAnswerProps = {
  runId: string;
  task: RunTask;
  onAnswered:
    () => void | Promise<void>;
};

export default function TaskAnswer({
  runId,
  task,
  onAnswered,
}: TaskAnswerProps) {
  const answer =
    useTaskAnswer({
      runId,
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
        />
      )}

      {task.answerType ===
        "FREE_TEXT" && (
        <FreeTextAnswer
          value={answer.textAnswer}
          onChange={
            answer.updateTextAnswer
          }
        />
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
          answer.submitting
        }
        onClick={() =>
          void answer.submitAnswer()
        }
      >
        {answer.submitting
          ? "Sender svar..."
          : "Send svar"}
      </button>
    </div>
  );
}