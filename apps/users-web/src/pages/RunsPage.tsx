import {useEffect, useState} from "react";

import {useNavigate} from "react-router";

import { apiFetch } from "../api/apiFetch";
import { useAuth } from "../auth/useAuth";
import styles from "./RunsPage.module.css";

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
    name: string;
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
  <main className={styles.page}>
    <header className={styles.topbar}>
      <div>
        <span className={styles.userLabel}>
          Logget ind som
        </span>

        <strong>
          {user?.displayName}
        </strong>
      </div>

      <button
        className={styles.logout}
        type="button"
        onClick={logout}
      >
        Log ud
      </button>
    </header>

    <section>
      <header className={styles.pageHeader}>
        <h1>Mine øvelser</h1>

        <p>
          Se de øvelser du er
          tilknyttet.
        </p>
      </header>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {!error &&
        runs.length === 0 && (
          <div className={styles.empty}>
            <strong>
              Ingen øvelser endnu
            </strong>

            <p>
              Du er ikke tilknyttet
              nogen øvelser.
            </p>
          </div>
        )}

      <div className={styles.runList}>
        {runs.map(
          ({
            role,
            scenarioRun}) => (
            <article className={styles.runCard} key={scenarioRun.id}>
              <div className={styles.cardMeta}>
                <span className={`${styles.badge} ${styles[ `status_${scenarioRun.status}`]}`}>
                  {getStatusLabel(
                    scenarioRun.status,
                  )}
                </span>

                <span className={styles.role}>
                  {getRoleLabel(role)}
                </span>
              </div>

              <h2>
                {scenarioRun.name ?? scenarioRun.scenario.name}
              </h2>

              {scenarioRun.scenario
                .description && (
                <p className={styles.description}>
                  {scenarioRun.scenario.description}
                </p>
              )}

              <button
                className={styles.openButton}
                type="button"
                onClick={() =>navigate(`/runs/${scenarioRun.id}`)}>
                {scenarioRun.status ==="IN_PROGRESS" ? "Fortsæt øvelse" : "Se øvelse"}
              </button>
            </article>
          ),
        )}
      </div>
    </section>
  </main>
);
}

