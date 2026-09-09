import {useEffect, useState} from "react";

import {useNavigate} from "react-router";

import { apiFetch } from "../api/apiFetch";
import { useAuth } from "../auth/useAuth";

type ScenarioRole =
  | "PARTICIPANT"
  | "TEAM_LEADER"
  | "INSTRUCTOR";

type ScenarioRunStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ABORTED";

type MyRun = {
  role: ScenarioRole;
  scenarioRun: {
    id: string;
    status: ScenarioRunStatus;
    startedAt: string | null;
    completedAt: string | null;
    scenario: {
      id: string;
      name: string;
      description: string | null;
    };
  };
};
//HELPER FUNKTIONS
function getStatusLabel(
  status: ScenarioRunStatus,
) {
  switch (status) {
    case "NOT_STARTED":
      return "Ikke startet";

    case "IN_PROGRESS":
      return "I gang";

    case "COMPLETED":
      return "Afsluttet";

    case "ABORTED":
      return "Afbrudt";
  }
}

function getRoleLabel(
  role: ScenarioRole,
) {
  switch (role) {
    case "PARTICIPANT":
      return "Deltager";

    case "TEAM_LEADER":
      return "Holdleder";

    case "INSTRUCTOR":
      return "Instruktør";
  }
}

export default function RunsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [runs, setRuns] = useState<MyRun[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    apiFetch<MyRun[]>(
      "/scenario-runs/me",
    )
      .then((data) => {
        if (!cancelled) {
          setRuns(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Kunne ikke hente dine øvelser",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p>Henter øvelser...</p>;
  }

  return (
    <main>
      <header>
        <div>
          <p>Logget ind som</p>
          <strong>
            {user?.displayName}
          </strong>
        </div>

        <button
          type="button"
          onClick={logout}
        >
          Log ud
        </button>
      </header>

      <section>
        <h1>Mine øvelser</h1>

        <p>
          Her kan du se de scenarieafviklinger, du er tilknyttet.
        </p>

        {error && (
          <p role="alert">
            {error}
          </p>
        )}

        {!error &&
          runs.length === 0 && (
            <p> Du er ikke tilknyttet nogen øvelser endnu.</p>
          )}

        {runs.map(
          ({ role, scenarioRun }) => (
            <article key={scenarioRun.id}>
              <div>
                <span>
                  {getStatusLabel(scenarioRun.status)}
                </span>

                <span>
                  {getRoleLabel(role)}
                </span>
              </div>

              <h2>
                {scenarioRun.scenario.name}
              </h2>

              {scenarioRun.scenario.description && (
                <p>
                  {scenarioRun.scenario.description}
                </p>
              )}

              <button
                type="button"
                onClick={() => navigate( `/runs/${scenarioRun.id}`)}>
                {scenarioRun.status === "IN_PROGRESS" ? "Fortsæt øvelse" : "Se øvelse"}
              </button>
            </article>
          ),
        )}
      </section>
    </main>
  );
}

