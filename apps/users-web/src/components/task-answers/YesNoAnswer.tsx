import type {RunTask} from "../../types/scenarioRun";

type Props = {
  task: RunTask;
  selectedOptionIds: string[];
  disabled: boolean;
  onSelectOption:
    (optionId: string) => void;
};

export default function YesNoAnswer({
  task,
  selectedOptionIds,
  disabled,
  onSelectOption,
}: Props) {
  return (
    <fieldset disabled={disabled}>
      <legend>Vælg svar</legend>
      {task.options.map(
        (option) => (
          <label key={option.id}>
            <input
              type="radio"
              name={`answer-${task.id}`}
              checked={selectedOptionIds[0] ===option.id}
              onChange={() =>
                onSelectOption(
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