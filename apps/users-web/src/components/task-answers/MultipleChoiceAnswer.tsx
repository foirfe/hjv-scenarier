import type {RunTask} from "../../types/scenarioRun";

type Props = {
  task: RunTask;
  selectedOptionIds: string[];
  onToggleOption:
    (optionId: string) => void;
};

export default function MultipleChoiceAnswer({
  task,
  selectedOptionIds,
  onToggleOption,
}: Props) {
  return (
    <fieldset>
      <legend>Vælg svar</legend>

      {task.options.map(
        (option) => (
          <label key={option.id}>
            <input
              type="checkbox"
              checked={
                selectedOptionIds.includes(
                  option.id,
                )
              }
              onChange={() =>
                onToggleOption(
                  option.id,
                )
              }
            />

            {option.optionText}
          </label>
        ),
      )}
    </fieldset>
  );
}