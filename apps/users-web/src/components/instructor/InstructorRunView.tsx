import type {
  InstructorRunDetail,
} from "../../types/scenarioRun";

import InstructorTaskCard from "./InstructorTaskCard";

type Props = {
  run: InstructorRunDetail;

  onActivate: (
    taskId: string,
    userId: string,
  ) => void;

  activationError: string | null;

  activatingKey: string | null;
};

export default function InstructorRunView({
  run,
  onActivate,
  activationError,
  activatingKey,
}: Props) {
  return (
    <section>
      <header>
        <p>Instruktørvisning</p>

        <h2>{run.scenario.name}</h2>

        {run.scenario.description && (
          <p>
            {run.scenario.description}
          </p>
        )}
      </header>

      {activationError && (
        <p role="alert">
          {activationError}
        </p>
      )}

      <div>
        {run.tasks.map((task) => (
          <InstructorTaskCard
            key={task.id}
            task={task}
            onActivate={onActivate}
            activatingKey={
              activatingKey
            }
          />
        ))}
      </div>
    </section>
  );
}